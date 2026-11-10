# Cloudflare Workers, R2 and MongoDB setup

## What runs where

- React/Vite remains the frontend. Set its `VITE_API_BASE_URL` to the Worker origin, with no `/api` suffix.
- Hono handles routing, CORS, authentication and JSON responses. Existing endpoint paths and booking/schedule response shapes are retained.
- MongoDB stores administrators, bookings, availability, holds and encrypted Instagram credentials. Booking `referenceImages` contains R2 object-key strings only.
- R2 stores image bytes. The Worker streams multipart uploads into the `MEDIA` binding and serves objects through `/media/:id`. R2 itself need not be public.
- A `DatabaseAPI` Durable Object owns a Mongoose 9 connection, so database sockets stay within the object that created them. It uses MongoDB for application data; its SQLite storage is not used for bookings.
- A five-minute Cron Trigger replaces the old Node timer for expired holds. Existing hold checks also run during booking submission.
- Brevo's HTTPS API replaces SMTP. The old SMTP password is not the new API key.

The migration does not deploy, change your existing `.env`, create a cloud bucket, connect to the production database or migrate existing records automatically. The future admin Connect/Reconnect Instagram consent flow remains future work.

## 1. Install local tools

Use Node 22.12+ or a current supported Node LTS and npm. Run commands from `backend` unless otherwise stated.

```powershell
npm ci
npm test
npm run build
```

`build` is `wrangler deploy --dry-run`: it bundles and checks configuration without publishing. Wrangler is pinned by the lockfile. A `whatwg-url` shim/default-export warning may appear from the MongoDB dependency path; the Worker boots in workerd, but live Atlas connectivity must still be verified against your test cluster.

## 2. Create a separate MongoDB test database

1. In MongoDB Atlas, create a test cluster/project or select a non-production test cluster.
2. Under **Database Access**, create a database user. Give it read/write access to `inkedbymars_test`; do not use an Atlas account password as a database password.
3. Under **Network Access**, allow your development machine's public IP for local testing.
4. Under **Connect → Drivers**, copy the Node.js connection string. Set the database path to `/inkedbymars_test`. URL-encode special characters in the password. Retain TLS and retry-write options.
5. For deployed Workers, the connection originates from Cloudflare, not your laptop. Configure an appropriate Atlas network-access policy for that environment. Do not assume the laptop allowlist works after deployment. A temporary `0.0.0.0/0` entry makes a test cluster reachable from arbitrary IPs; this broadens access and requires strong, database-scoped credentials. Establish the production network policy before cutover.

Cloudflare supports Mongoose 9 with `nodejs_compat`. The Worker does not use the discontinued Atlas Data API.

## 3. Configure local secrets

```powershell
Copy-Item .dev.vars.example .dev.vars
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Edit `.dev.vars` locally:

| Field | Source and purpose |
| --- | --- |
| `MONGO_URI` | Atlas driver connection string for the test database. |
| `JWT_SECRET` | First generated random value; signs administrator sessions. |
| `TOKEN_ENCRYPTION_KEY` | Second generated value: exactly 32 random bytes encoded as base64. Retain it across deployments; changing it without re-encrypting stored credentials prevents decryption. |
| `PUBLIC_MEDIA_BASE_URL` | `http://127.0.0.1:8787` locally. In production, the actual Worker/custom API origin, not the R2 S3 endpoint. |
| `META_APP_ID`, `META_APP_SECRET` | Existing Meta application settings, optional until testing Instagram. |
| `META_ACCESS_TOKEN` | A valid Facebook Login credential with the existing Instagram permissions. An expired token cannot be renewed just by changing metadata. |
| `INSTAGRAM_USER_ID` | The linked Instagram professional account's numeric ID. |
| `INSTAGRAM_TOKEN_EXPIRES_AT` | Leave blank to discover expiry from Meta. This is not a lifetime setting. |
| `BREVO_API_KEY` | Brevo **SMTP & API → API Keys**; create an API key, not an SMTP key. Optional while email is disabled. |
| `BREVO_SENDER_EMAIL` | A verified Brevo sender address. |
| `ADMIN_EMAIL` | Actual recipient for studio notifications. |

Never commit `.dev.vars`, `.env`, token stores or encryption keys. Wrangler vars in `wrangler.toml` contain non-secret settings only. `.dev.vars` is separate from the old `.env`; it is deliberately not copied automatically.

## 4. Test R2 locally without a Cloudflare account

```powershell
npm run dev
```

Wrangler starts at `http://127.0.0.1:8787`. Its R2, rate-limit and Durable Object bindings run locally. Objects are persisted under ignored `.wrangler/`, not uploaded to Cloudflare. Do not add `--remote` during these tests.

In a second terminal:

```powershell
curl.exe http://127.0.0.1:8787/api/health
node scripts/smoke-worker.mjs
```

The smoke script generates a synthetic >3 MB image-like payload, sends multipart data, reads it back from local R2, compares every byte, and checks invalid signatures, empty files and incorrect lengths. It does not require MongoDB or send a booking. Synthetic bytes verify transport, not visual image decoding.

`/api/health` is Worker liveness, not proof of Atlas connectivity. Verify `/api/public/availability` against the configured test cluster to check the database path.

Upload an actual image too:

```powershell
$imagePath = 'C:\path\to\reference.jpg'
$imageBytes = (Get-Item -LiteralPath $imagePath).Length
curl.exe -X POST http://127.0.0.1:8787/api/uploads -H "X-File-Size: $imageBytes" -F "file=@$imagePath"
```

The response is `{ "success": true, "key": "references/<uuid>.jpg", "url": "http://127.0.0.1:8787/media/<uuid>.jpg" }`. Open that URL and check the real image. One file per request, up to 20 MiB; JPEG, PNG and WebP only. Four booking references use four upload requests.

`X-File-Size` is the file's byte count, not the multipart request's length. The browser sets it from `File.size`. The server verifies it as the bytes arrive. It is required because R2 stream writes require a known length. `FixedLengthStream` supplies that length without buffering the entire file. The parser retains only a 12-byte signature prefix and bounded stream queues. No `request.formData()`, full-file `arrayBuffer()`, base64 conversion or temporary disk file is used by the upload handler.

Multipart errors, invalid signatures, incorrect lengths and extra files delete the request's object key. Signatures are basic type checks, not a full decoder or malware scan. No SVG/HTML upload is accepted. Server-generated UUIDs determine object keys; filenames cannot choose paths.

Media URLs are intentionally readable by anyone holding the URL, matching the public-URL requirement. UUIDs prevent enumeration but are not authorization. For confidential references, add authenticated/signed reads before collecting them. Unsubmitted successful uploads are not automatically deleted; configure an owner-approved retention/reconciliation process rather than expiring all reference objects, which would also erase images attached to bookings.

## 5. Initialize the test database and seed an administrator

The local Node utilities read `.env` or process environment, not `.dev.vars`. Supply the **test** `MONGO_URI` explicitly for these commands so an old production `.env` cannot select the wrong database. Shell environment values take precedence over dotenv.

```powershell
$env:MONGO_URI = 'mongodb+srv://TEST_USER:ENCODED_PASSWORD@YOUR_TEST_CLUSTER/inkedbymars_test?retryWrites=true&w=majority'
npm run db:indexes
$env:SEED_ADMIN_NAME = 'test-admin'
$env:SEED_ADMIN_EMAIL = 'test-admin@example.com'
# Set SEED_ADMIN_PASSWORD privately in this terminal or a local secret file.
npm run seed:admin
```

`db:indexes` calls `createIndexes`, not `syncIndexes`; it does not drop other indexes. The booking and schedule unique indexes are essential for conflict protection. Stop and investigate if index creation reports duplicate existing records. Seeding is explicit and is not run on Worker startup. Existing administrator password hashes remain compatible.

Then verify `GET /api/public/availability`, log in at `POST /api/auth/login`, and inspect `GET /api/auth/me` with the returned Bearer token. Test auth failures, booking conflicts, confirmation ranges, cancellation/release and blocked dates only against the isolated test database. Database failures return errors; they must not produce fabricated open availability.

## 6. Connect the frontend locally

In the frontend's local environment file:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8787
```

Run `npm run dev` in `client`, then:

1. Select a date and time and fill in the request.
2. Upload a real image larger than 2 MB. The browser sends `FormData`, leaves the multipart boundary to the browser, and retains only the returned object key and preview URL in component memory.
3. Verify the preview. Remove/retry a failed selection; no failed reference is added to the draft.
4. Submit to the test database and inspect the booking record. `referenceImages` must be an array of `references/...` strings. No `data:image`, buffer or raw bytes should be stored.
5. Log in as test admin and inspect reference links in the booking dialog. API serialization supplies URLs for the existing UI while database records retain keys.
6. Reload the Worker and verify database-backed state remains. A restart must not create a new test administrator or reset bookings.

Only the listed frontend origins in `CLIENT_URL` can make browser API requests. For production use exact origins, not `*`. The frontend's existing Bearer-token authentication remains supported; cross-site cookies are not required.

## 7. Existing reference-data migration

The new schema stores strings. Existing records may contain `{url,publicId}` objects with base64 data. **Do not point the new application at an unmigrated production database.** Back up the database and first rehearse on a restored test copy.

```powershell
# With MONGO_URI explicitly set to the restored TEST database:
node scripts/migrate-references.cjs
$env:MIGRATION_API_ORIGIN = 'http://127.0.0.1:8787'
node scripts/migrate-references.cjs --apply
```

The first command reports candidate counts without changing records. `--apply` uploads supported legacy base64 JPEG/PNG/WebP images through the Worker and replaces each booking's reference array only after all its uploads succeed. It uses a conditional update to avoid overwriting a concurrently changed record. Already converted arrays are skipped. External URLs and unsupported types stop for manual review rather than fetching arbitrary URLs.

The public upload rate limit also applies to this utility; migrate in controlled batches and retry after cooldown. Successful uploads preceding a failure can become orphan objects and require reconciliation. Keep the backup until records, previews and admin workflows have been checked. No migration command has been run against your database by this task.

## 8. Create Cloudflare resources after local tests pass

1. Create/sign in to a Cloudflare account and enable **R2 Object Storage**. R2 may require billing enrollment even when usage remains in a free allowance.
2. Run `npx wrangler login` and approve the Cloudflare account in the browser. Run `npx wrangler whoami` to verify the selected account. `wrangler.toml` needs no hard-coded account ID when Wrangler can select the account; CI uses `CLOUDFLARE_ACCOUNT_ID` and a narrowly scoped `CLOUDFLARE_API_TOKEN` instead.
3. Create separate real buckets:

```powershell
npx wrangler r2 bucket create inked-by-mars-media
npx wrangler r2 bucket create inked-by-mars-media-preview
```

4. Keep the bucket names synchronized with `wrangler.toml`. The `MEDIA` binding is injected by Cloudflare. **No R2 access-key ID or S3 secret is required** for Worker binding reads/writes. An R2 S3 API key is only needed for separate external S3 tools, not this application.
5. The committed config includes the `DATABASE` Durable Object binding, its `v1` SQLite-class migration, three rate-limit bindings and the five-minute Cron Trigger. Do not delete or reuse migration tags when extending an already deployed Durable Object class.
6. Use a dedicated staging Worker/database/bucket before production. Copy the configuration to an ignored staging config and change its Worker name, both bucket names, frontend origins, and secret values. Do not assume bindings/secrets inherit into named Wrangler environments.

## 9. Configure cloud secrets and public settings

Run each command and paste the value at the prompt:

```powershell
npx wrangler secret put MONGO_URI
npx wrangler secret put JWT_SECRET
npx wrangler secret put TOKEN_ENCRYPTION_KEY
# Only if Instagram is enabled:
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
npx wrangler secret put META_ACCESS_TOKEN
npx wrangler secret put INSTAGRAM_USER_ID
# Only if email is enabled:
npx wrangler secret put BREVO_API_KEY
```

For a newly named Worker, Wrangler may prompt to create its remote record while setting secrets. This is a cloud mutation; perform it only at this deployment stage. `.dev.vars` is never uploaded automatically as a secret store. Keep `INSTAGRAM_TOKEN_EXPIRES_AT` unset/blank when validating a fresh bootstrap token. Encrypted stored credentials take precedence over that bootstrap; replacing an established connection requires deliberate credential rotation, not editing metadata.

In `wrangler.toml` set `NODE_ENV = "production"`, the exact production `CLIENT_URL`, `PUBLIC_MEDIA_BASE_URL = "https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev"`, and, if using email, `NOTIFICATION_EMAIL_ENABLED = "true"`, `BREVO_SENDER_EMAIL` and `ADMIN_EMAIL`. These non-secret fields belong under `[vars]`, before the binding tables. Use an API custom domain if desired and make `PUBLIC_MEDIA_BASE_URL` match it. Do not use the R2 S3 endpoint as a public media URL.

The Worker retains bcrypt verification for existing hashes. Measure login CPU in staging and select a Workers plan/CPU allowance sufficient for bcrypt; the free plan's CPU budget may be too small for cost-12 password verification. Do not lower existing password-hash strength to conceal that limit.

## 10. Deploy and verify

```powershell
npm test
npm run build
npm run deploy
```

Only `deploy` publishes. Verify health, a real image upload/download, frontend CORS, login, real Atlas availability, conflict handling and expiry cleanup in staging. Trigger Cron locally at `http://127.0.0.1:8787/cdn-cgi/local/scheduled`; it is not automatically scheduled by local development. Enable email only after confirming the verified sender and sandbox recipient. Use `npx wrangler tail` for safe status/request-ID logs; never add token or request-body logging.

Update the deployed frontend's `VITE_API_BASE_URL`, rebuild it, and cut over only after reference migration and index verification. Keep the previous deployment and database backup for rollback. No Cloudflare resources, production records or deployed frontend have been modified by the local implementation.

## References

Troubleshooting Instagram `status: null`: the request failed before an HTTP response, or an earlier transport implementation lost the response while parsing JSON. Use the corrected native HTTP binding: Workers rejects `redirect: 'error'` before sending the request. This implementation uses `manual` and explicitly blocks 3xx responses. Restart Wrangler after updating. The structured `transport` log fields identify timeout/network failures; no expiry adjustment can fix an unsupported Fetch option. An actual Meta 401/403 after this correction is a separate credential or permission issue.

- [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [MongoDB and Mongoose on Workers; Durable Object connections](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/)
- [R2 Worker bindings and stream length requirements](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [R2 Worker API setup](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cron local testing](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
