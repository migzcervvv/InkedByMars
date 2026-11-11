# Implementation plan

## Admin panel rebuild

The studio account menu now provides account editing for signed-in admins and team management for existing super administrators. The team form creates regular admin accounts using the existing schema and leaves existing roles intact. Tests cover role enforcement, account-edit permissions and password-change session invalidation.

The account button opens an anchored menu and links super administrators to the dedicated Manage users page. Team actions include creating, editing, deleting and resetting another user's password. Calendar defaults now use individual time fields with the final end time visible beside the add-slot control. Browser checks use isolated fixtures at 1440, 768 and 390 px.

Calendar now stores editable default start times and a final end time in MongoDB. The defaults apply to dates without a saved schedule across public availability, booking holds and the admin agenda. Booking references open in an in-panel viewer, and the Worker permits the Netlify site to embed media responses.

Bookings and Calendar replace the previous five primary destinations. The review queue uses backend counts, hold expiry and pagination. Confirmation and rescheduling require an explicit range, and closures reject occupied slots. New public and admin reservations start tomorrow in Asia/Manila. Existing same-day appointments remain visible, and Instagram Direct Messages remains a separate future phase. See the [admin implementation brief](ADMIN_REDESIGN_PLAN.md) for the transition rules.

The backend tests cover Manila midnight and leap dates, direct same-day requests, expired and stale booking decisions, closure boundaries, reserved slots and public data stripping. Frontend lint, tests and build, Wrangler dry run and the isolated workerd storage test pass. Chromium fixtures verified 1440, 768 and 390 px layouts, a short phone viewport, reduced motion, keyboard focus restoration, conflict recovery, legacy redirects, range blocking and reopening, and the public policy with a Los Angeles browser timezone. The app inspector reported zero failures, with whitespace warnings for short queues and unselected panes. Artifacts are in ignored `.taste-skill/admin/`. Live MongoDB transaction races, notification delivery and Supabase-backed previews still need staging validation. Run `npm run db:indexes` on the intended database before deploying the matching frontend and Worker.

## Supabase Storage replacement for R2

Status: adapter and configuration implemented locally; hosted validation and existing-object cutover are pending. The selected provider is Supabase Storage on a Free project. The key setup is documented in [backend/CLOUDFLARE_SETUP.md](backend/CLOUDFLARE_SETUP.md).

Reason: the owner cannot proceed with R2's credit-card enrollment requirement. Replace R2 as the media backend while retaining MongoDB for application records and the Hono Worker API. Do not solve this by putting image bytes or base64 in MongoDB.

### Provider selection requirements

- [ ] Verify current official terms and an actual setup flow before selecting a provider. The usable test tier must require no credit card for account creation, bucket/media storage, API credentials, upload and download. A signup-only exception or temporary trial credit is insufficient.
- [ ] Record free storage/bandwidth/request limits, maximum image size, API availability, suspension behavior, retention, deletion/export support and any restrictions affecting this application. Do not promise unlimited or permanently free storage.
- [x] Verify the multipart transport can stream larger inputs in isolation. The public booking endpoint now follows the owner's storage-saving requirement and accepts only optimized WebP up to 192 KiB.
- [ ] Verify Worker-compatible authentication and HTTP operations without filesystem access, native Node binaries or whole-file buffering. Check whether public or signed reads can meet reference-image access requirements.

### Implementation and migration sequence

1. Extract a provider-independent media service with upload, metadata/existence lookup, read and delete operations. Keep provider credentials in Worker secrets, never browser code or MongoDB booking documents.
2. Implement the selected provider behind that interface. Replace direct `env.MEDIA` coupling in upload, media-read and booking-reference validation paths. Preserve multipart input, streamed type/size verification, backpressure, error cleanup and rate limits. Do not assume an S3-compatible SDK streams safely without testing it.
3. Keep booking references as stable object-key strings. Prefer retaining the Worker's media URLs so switching storage does not break admin previews or existing links. If the provider requires opaque IDs, keep their mapping in server-owned media metadata rather than embedding vendor logic throughout booking components.
4. Update local examples, bindings, dependencies, setup instructions, upload smoke tests and legacy-reference migration tools for the new provider. Define a real local/test strategy; do not ship a fake storage service as the production integration.
5. If R2 contains existing objects, inventory and copy them to the new storage, verify byte integrity and metadata, then cut over with a documented rollback and temporary dual-read path where necessary. Keep original objects until verification completes. If R2 was never provisioned, skip object copying but still verify existing database references.
6. Remove R2 bindings and obsolete setup instructions only after replacement reads, writes and reference validation pass. Do not create a new paid/billing-enabled account, move production objects, delete R2 data or deploy during planning.

### Acceptance criteria

- [ ] The owner can follow the complete test setup, upload and retrieve real media without supplying a credit card.
- [ ] A JPEG, PNG or WebP larger than 2 MiB can be selected in the browser and retrieved from the live bucket as the optimized WebP. Verify byte-exact retrieval at the 192 KiB limit and cleanup after rejected or interrupted uploads.
- [ ] MongoDB still stores reference keys/URLs only; booking creation and admin previews work with the new storage.
- [ ] Secrets stay server-side; access rules, throttling and failure states remain explicit. A provider outage must not be shown as a successful upload.
- [ ] Existing references survive cutover, or a verified migration and rollback is documented. Test uploads do not alter production bookings.
- [ ] Frontend/backend tests, Worker dry-run and actual provider integration checks pass. Record evidence and remaining limits before declaring the migration complete.

The Supabase adapter handles streamed uploads, private reads, existence checks and cleanup. The Worker retains the `/media/:id` URLs and MongoDB reference keys. Booking reference optimization runs one file at a time in the browser. It accepts source files up to 20 MiB, strips source metadata through canvas rendering, limits the longest edge to 1280 px and reduces quality or dimensions to fit 192 KiB. The browser sends only the optimized WebP and the Worker enforces its type and byte limit. The isolated workerd test verifies byte-exact retrieval at the new limit, rejects unsupported types and oversized inputs, and checks cleanup. The legacy migration utility uses the server-side storage adapter directly so existing images retain their types and bytes. Hosted Free-account enrollment, a live bucket round-trip and any existing object migration still need verification before deployment. The plaintext Mongo URI was removed from local Wrangler configuration. Rotate that credential and keep the replacement in secrets.

Chromium verified that synthetic JPEG, PNG and WebP inputs between 2.2 and 4.1 MiB reached the upload transport as readable WebP files between 97 and 177 KiB. It also verified transparency, no upscaling for small images, and rejection of corrupt, oversized and unsupported selections before upload.

The existing five-minute Worker trigger now removes references due 14 days after the recorded appointment start in Asia/Manila. It rechecks the booking under the same Durable Object write queue used for rescheduling, keeps objects still referenced by another booking and retries failed deletions. Admin hard deletion removes unshared references before deleting the record. Unit tests cover the cutoff, rescheduling, shared keys and retries. Live cleanup remains pending in a test bucket and database. Unattached uploads have no appointment-based deadline.

## Approved direction

Mars's signed flash sheet becomes a portfolio poster, backed by the red/gold wax-seal identity. The three public pages are Home, Booking (availability included), and Works (Instagram). Admin remains protected. Implementation is local; no commit or publication.

## Phases

1. **Architecture and source of truth** — create repository instructions/goals, route boundaries, content configuration, legacy redirects, shared accessible primitives and centralized CSS tokens.
2. **Home and artwork motion** — build the branded hero, selected work, artist biography, category-to-booking interaction, concise process/FAQ and integrated contact. Keep actual artwork as the visual material.
3. **Unified booking** — compose the existing API-backed calendar and request into one page; preserve draft fields, show reliable availability, align uploads with server validation, review and display a truthful inline receipt.
4. **Instagram Works** — reuse server endpoints, consolidate transport, provide resilient feed state and accessible media presentation.
5. **Administration and cleanup** — preserve admin behavior while sharing controls/calendar/theme, remove inactive duplicate public paths/styles, and fix lint failures touched by the architecture.
6. **Verification and documentation** — run lint/build, isolated behavior tests, viewport/reduced-motion inspection and screenshot critique. Record results and operational limits here.

## Status

- All six implementation phases completed locally. See verification and remaining operational limits below.

## Baseline

- Homepage: 13 taste-inspector failures / 14 warnings at 1440, 768 and 390 px.
- Frontend ESLint: six existing errors.
- Production build: succeeds, with a 573.56 kB initial JS chunk and eager admin imports.
- Backend and Instagram success states not reachable in the earlier live local audit. QA must clearly separate fixture evidence from live verification.

## Design record

- Skill direction: pinned poster; seed 2004175288; brand palette and approved Unbounded/Onest type retained.
- Subject material: signed flash sheet, red/gold seal, red spider-lily work, blue fish, dagger/chain work, private Las Piñas studio and two existing Instagram identities.
- Sheet's multi-person biography and prolonged process scenes do not match a single-artist three-page site. Use a single biography and compact process; do not fabricate people or enlarge empty scenes.
- No downloaded stock imagery or fabricated testimonials/statistics. Existing local assets are inherited and require provenance confirmation before launch.

## Implemented architecture

- Public routing is composed in `client/src/app/AppRoutes.jsx`. Feature pages live in `features/studio`, `features/booking`, and `features/works`; protected administration is lazy-loaded separately.
- Shared components include Button, Field, Dialog, Notice, Loader, PageIntro, public layout/navigation/footer and the calendar used by both booking and administration.
- Booking owns draft validation, normalized API payloads, date/time selection and an inline receipt. A calendar outage disables unknown dates. Cancellable/date-sequenced requests prevent old responses from overriding a newer selection. A 409 refreshes times without discarding the brief.
- References are compressed to a 540,000-byte target and checked against the actual 750,000-character data URL limit. Upload errors are visible; successful references can be removed. The server API contract is unchanged.
- Works uses the shared Axios transport and existing Instagram backend routes. Media filtering, cursor pagination, duplicate-ID removal and accessible photo/carousel/video presentation stay within this integration. No Instagram credentials were added to the frontend.
- `client/src/index.css` is the sole stylesheet entry. Unbounded and Onest are self-hosted, with their SIL Open Font Licenses in `client/public/fonts/`. Brand tokens follow the original red/gold logo and supporting slate-blue reference background.
- Removed inactive duplicate pages, the alternate mock gallery, the unused global Facebook SDK loader, legacy theme/PostCSS definitions, Vite starter styles and seven unused direct dependencies. Tailwind runs through its Vite plugin only. The existing Express controller/service/model structure and business rules are retained.
- Old URLs: `/gallery` -> `/works`; `/availability` and `/booking/confirmation` -> `/booking`; `/about` -> `/#about`; `/contact` -> `/#contact`; `/privacy-policy` -> the shared privacy dialog. No extra primary public page was added.

## Verified results

| Check | Result |
| --- | --- |
| `npm run lint` | Pass, zero ESLint errors |
| `npm test` | Six regression tests pass: availability truthfulness, blocked/booked precedence, stage validation, payload mapping and field budgets |
| `npm run build` | Pass; no oversized-chunk warning |
| Skill source lint | 0 FAIL, 5 WARN: two actual form-control border declarations and three date-padding checks, all intentional |
| Homepage inspector | 0 FAIL, 1 WARN at 1440 / 768 / 390; all generated final screenshots opened |
| Booking browser fixtures | Pass at 1440 / 768 / 390: category preselection, known availability, date-response race, draft preservation, image compression/removal, review, privacy Escape/focus, 409 recovery, inline pending receipt, no overflow |
| Instagram browser fixtures | Pass: posts/profile endpoints, real local-image test responses, filters, carousel children, cursor loading/deduplication, empty and outage states; layouts checked at all three widths |
| Navigation/admin fixtures | Pass: native dialog Escape/focus, mobile navigation, compatibility redirects, safe direct receipt entry, privacy redirect, protected route, fixture login, named mobile destinations and shared admin calendar |
| Reduced motion | At 390 px, content visible, no scripted transforms on reveal/parallax targets, no overflow |
| Browser exceptions | None in the successful regression run or final homepage inspector |
| Final console check | Hero uses the React 18-compatible lowercase `fetchpriority` attribute; zero console warnings/errors and correct high-priority image hint verified in the browser |
| Git checks | Working and staged diff checks pass; local environment files remain present, ignored and untracked |

Build output: global CSS 43.45 kB (9.83 kB gzip). The former 573.56 kB monolithic JavaScript entry is split into a 58.47 kB shell, shared vendor code and route chunks (Home 121.38 kB, Booking 21.67 kB, Works 9.38 kB; admin chunks load separately). These are individual chunk sizes, not a claim that the whole site downloads only the shell.

### Before and after

| Homepage measure | Before | Final |
| --- | --- | --- |
| Inspector failures / warnings | 13 / 14 | 0 / 1 |
| Hero headline lines | 3 at every width | 2 at every width |
| Phone hero type | 27.3 px | 48 px |
| Body copy | 15 px desktop / 14 px phone | 18 px desktop / 16 px phone |
| Typeface families | 3 | 2, locally loaded |
| Type sizes at each viewport | 15 desktop | 5 desktop, tablet and phone |
| Desktop hero imagery | 12% | 41% |
| Phone document height | 10,067 px | 5,934 px |

### Final visual critique

```text
ROUND 2
Seen in one second: Mars's gold name, red/wine field, and signed illustrated flash sheet.
Idea (one sentence): Mars's flash sheet becomes the opening portfolio poster, with the original wax seal signing the composition.
Live thing: select a work category, inspect its example, and carry the selection into the combined booking page.
Layout words by section: hero=artwork window / selected work=offset image pair / artist=biography with collection / styles=interactive selection / process=compact text sequence / questions=reading columns / contact=inverse field / footer=typographic close.
Scores: design 7.5 · usability 8.0 · creativity 7.0 · content 7.5 -> overall 7.6.
Caps applied: none from measured failures. The remaining no-footage warning is defended below.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. The hero uses the inherited 1080 px flash-sheet source, which limits very large display sharpness. See after/desktop-fold.jpg. A higher-resolution owner-approved original is the appropriate replacement; no image was fabricated.
2. The biography's inherited collage includes a small central portrait rather than a dedicated portrait. See after/desktop-page-01.jpg. It is correctly labeled as a collection, not a single portrait; an approved portrait would strengthen the personal introduction.
3. No actual studio/process footage exists in the repository. See after/desktop-fold.jpg. The hero artwork itself moves, and Instagram reels have a real media viewer, but the homepage has no video. A generic found clip would not prove this artist's work.
```

The first rendered round revealed weak contrast on the red biography field and an undersized explanatory line on phones. The final round uses the deeper brand red and a 20 px phone introduction; it also removes the legacy cream/gray and name-only-title warnings. All seven final homepage images, Booking/Works at the three widths, and representative error, receipt and reduced-motion views were reviewed. Full-page booking captures were reset to the document top to avoid sticky-header capture artifacts.

### Assets, copy and operational limits

- Imagery is inherited from `client/public`: `sample.jpg`, `freehand.jpg`, `custom.jpg`, `minimalistic.jpg`, `flash.jpg`, `artist.jpg`, and the original `mars-logo.svg`. No stock photographs, generated tattoos, decorative code drawings or downloaded video were used. There are no new external-image credit lines to add.
- The existing logo remains unchanged; its artwork/shading is a brand asset, not a CSS shadow or gradient treatment. Motion uses the actual images and seal.
- The personal introduction and process copy use the existing artist/location/work categories. Unsupported career statistics, return-client percentages, scarcity statements and medical instructions were removed. Contact is centralized using the email on the former Contact page; the owner must confirm this choice because the old footer differed.
- The backend and Instagram were not started against production credentials or databases. Browser API responses were intercepted only inside the test browser. Fixtures are saved under ignored `.taste-skill/`, do not ship with the app, and created no real bookings, emails or admin changes.
- Live MongoDB availability, Instagram token/account access, reel playback from Meta URLs and notification delivery still require verification in the owner's configured deployment. Privacy text and inherited media provenance also require owner review before publication.
- No commit, push or deployment was made. Existing commits containing previously tracked environment files were not rewritten.

Local evidence: `.taste-skill/after/report.json`, `after-inspect.txt`, `after-source-lint.txt`, `redesign-build.txt`, `regression/results.json` and the responsive screenshots. `FRONTEND_AUDIT.md` remains the historical baseline, not the final implementation specification.

## Admin seed and Instagram diagnosis (10 November 2026)

- Created the explicitly requested `admin` / `admin@gmail.com` account through the Admin model. Verified active status and password comparison against the bcrypt hash. Credentials were passed in process environment only, not embedded in source or written to a tracked file.
- Hardened the existing seed command: required inputs, login-name collision check, explicit update flag for an existing account, password verification, and orderly database disconnection.
- The Works 401 originates in server-owned Instagram credentials, not a missing public-page login. Configured local expiry is 31 July 2026. Meta's live `debug_token` response reports `is_valid: false`, token expiry 9 August 2026 and data-access expiry 8 September 2026.
- The initial hypothesis that the configured value used seconds was incorrect; it already uses milliseconds. Added explicit seconds/milliseconds normalization and regression tests as hardening, not as a claim to revive an expired token.
- Limited automatic admin-session clearing to admin/auth endpoints. A public Instagram 401 no longer logs an authenticated studio administrator out.
- Restoring the live feed requires fresh Meta authorization, a valid server-side `META_ACCESS_TOKEN` with its corresponding expiry, and a backend restart. No token was fabricated, disabled or exposed, and no credential expiry was extended locally to bypass validation.

## Mobile booking progression

- Below 768 px, choosing a date scrolls to its time panel, including its loading/error state; choosing a time scrolls to “Tell me your idea.”
- Scrolling runs after React renders the next state and uses the existing header-clearance spacing. Reduced-motion preferences use immediate scrolling. Desktop layout and scroll behavior are unchanged; draft fields and form stage are preserved.
- Verified in an isolated browser at 390 px with normal and reduced motion: both destinations settle approximately 96 px below the viewport top and draft input survives. At 1440 px no automatic scrolling occurs. Frontend lint, build and diff checks pass.

## Homepage artwork interaction (superseded by the refinement below)

- Kept the approved palette, fonts, navigation and section composition. Retained “The pinned poster” direction (seed 2004175288), with no new draw or asset replacement for this focused enhancement.
- Idea: Mars’s signed flash sheet becomes an artwork visitors can handle and inspect. Three drawing targets open close-ups of the original photograph; previous/next controls and a whole-sheet view make exploration deliberate. The booking link carries `style=flash` into the existing request flow.
- The sheet responds to fine-pointer movement within a three-degree limit, settles on pointer exit, and turns gently with native scrolling. The seal presses into place. Reduced motion removes those transforms. All animation stays scoped to Home with GSAP cleanup; touch and keyboard controls use native buttons and the existing accessible dialog.
- No new dependencies, fabricated work, availability promises, environment changes or backend changes. The existing signed sheet is the sole source for every new close-up. Existing portfolio provenance requirements remain in effect.
- Frontend lint/build and eight existing unit tests pass. The browser interaction audit checks 1440, 768 and 390 px plus reduced motion, drawing navigation, whole-sheet recovery, keyboard activation, native dialog focus containment, Escape/focus restoration, booking destination, pointer reset and horizontal overflow. Artifacts and the executable regression script are ignored under `.taste-skill/alive-interactions/` and `.taste-skill/home-interactions.mjs`.
- Final inspector: zero failures, one inherited no-footage warning at all three widths. Compared with the previous completed audit, hero image coverage grows from 41% to 46%; the title remains two lines, with the same two fonts and five text sizes. The fresh before-audit attempt timed out before capture; the preceding completed `.taste-skill/after/` audit is the baseline. Browser audits succeeded with a disposable headless browser using the local audit launcher; this does not alter application security or dependencies.
- Opened all seven final fold/page screenshots and desktop/tablet/phone close-up captures. No real studio footage exists locally; unrelated video would not represent Mars’s work. No found or generated media, stand-ins or sample business content were added.

```text
ROUND 2
Seen in one second: Mars’s gold name and an original signed sheet with drawing targets.
Idea (one sentence): Mars’s flash sheet becomes a drawing collection visitors can inspect before requesting a session.
Live thing: select a drawing, inspect its crop, cycle through details, and continue to Flash booking.
Layout words by section: hero=interactive sheet / work=offset pair / about=artist collection / styles=selection / process=sequence / questions=reading columns / contact=inverse field / footer=typographic close.
Scores: design 8.0 · usability 8.0 · creativity 7.0 · content 7.5 -> overall 7.8.
Caps applied: creativity stays at 7; interactive artwork inspection is a familiar approach, made specific by Mars’s actual drawings.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Enlarged detail exposes the 1080px source’s limited resolution (alive-interactions/detail-1440-false.jpg). A higher-resolution owner-approved original would improve sharpness.
2. The original image includes a broad leather surround (alive-after/desktop-fold.jpg). It is retained to keep the signed sheet intact and hotspot coordinates faithful; a clean original scan would allow a tighter presentation.
3. The new signature interaction is concentrated in the hero (alive-after/mobile-page-01.jpg). The existing style selector provides a second useful interaction; the reading sections remain quiet rather than introducing unrelated effects.
```

## Homepage refinement and Instagram 500 diagnosis

- Removed the hero drawing targets, full-sheet link, detail dialog and extra wax-seal placement. Replaced the unused explorer component with `HeroArtwork`; kept its reduced-motion-aware pointer response and scroll motion. The header's original logo remains.
- Removed the artist collage caption and every category-name/by-Mars caption below the style preview. Category descriptions and booking links remain functional.
- Added one shared `--home-art-height` token: the smaller of 600px and 64svh. Hero artwork, the portfolio pair, artist collage and category previews scale through their containing figures. Images retain their proportions, and portrait work no longer grows beyond the viewport on wide or short screens. Removed obsolete explorer/dialog/seal styles.
- Frontend lint/build and eight unit tests pass. Browser regression passes at 1440x900, 1440x600, 768x1024, 390x844, reduced-motion 390x600 and landscape 844x390. It verifies all requested removals, the retained header logo, every image-height limit, all four style selections and booking destinations, no overflow, and no runtime exceptions. Lazy images were explicitly decoded in the test browser before measurement.
- Final visual inspector: zero failures and the inherited no-footage warning. All seven final screenshots were reviewed in `.taste-skill/home-refinement/`. The current user brief explicitly takes precedence over the skill's preference for large hero imagery: desktop coverage is now 26%, down from 46%, and the page is 6.2 screens rather than 7.3. No media assets or business content were invented or replaced.
- Instagram reproduction initially returned HTTP 500 from Meta's token introspection endpoint with OAuth code 2 and `is_transient: true`. Direct authenticated profile/media reads using the same configured token returned HTTP 200. A subsequent check also reproduced transient failure from the exchange endpoint while the token still authorized media reads.
- Token inspection outages now defer inspection for 60 seconds and let the actual Graph data endpoint authorize each read. Transient exchange outages may reuse an existing token only until its true expiry, with the same bounded retry delay. No successful validation, new expiry or replacement token is fabricated or persisted on outage. Invalid-token responses still stop immediately. Unknown expiry metadata no longer produces an invalid-date exception. Removed duplicate token lookups from the three Instagram service operations.
- Added seven isolated Instagram regression tests alongside the two expiry tests: transient inspection recovery and retry, explicit invalid tokens, authentication rejection by the data endpoint, refresh outage with strict real-expiry enforcement, permanent configuration errors, missing expiry metadata and refresh authentication rejection. All nine pass without network requests or token-store writes.
- Live service profile and post reads succeeded after the patch. During final route verification, the configured token reached its real expiration: Meta reported code 190/subcode 463, expired 10 November 2026 at 00:00 PST (16:00 UTC+8). Both local HTTP routes then correctly returned 401 `IG_TOKEN_EXPIRED`. Restoring the feed now requires fresh long-lived Facebook authorization in `META_ACCESS_TOKEN` and a backend restart; the current blank expiry field can remain blank. No environment values were modified or exposed.

```text
ROUND 1 — requested refinement
Seen in one second: Mars’s gold name and a complete, smaller signed flash sheet.
Idea (one sentence): The original sheet provides the moving artwork while the existing style selector carries exploration into booking.
Live thing: select Custom, Freehand, Minimalistic or Flash and carry that category into Booking.
Layout words by section: hero=quiet artwork / work=bounded offset pair / about=artist collection / styles=selection / process=sequence / questions=reading columns / contact=inverse field / footer=typographic close.
Scores: design 7.5 · usability 8.0 · creativity 7.0 · content 7.5 -> overall 7.6.
Caps applied: creativity remains 7; this refinement intentionally prioritizes the owner's cleaner composition.
Top three observations (most visible first), each with its screenshot and disposition:
1. Smaller desktop artwork leaves more wine-colored space (home-refinement/desktop-fold.jpg). This is deliberate to satisfy the image-size request; copy and image remain balanced within the outer frame.
2. The signed sheet still includes its original leather surround (home-refinement/mobile-fold.jpg). Retained the real asset rather than manufacturing a new crop or image.
3. The biography still uses the inherited collage (home-refinement/desktop-page-01.jpg). Its caption is removed as requested; the alt text continues to describe the collection accurately.
```

## Future plan: Instagram connection and credential lifecycle

Status: planned; not implemented in the current changes.

Objective: eliminate recurring manual token copying and environment-file edits. The owner authorizes through Meta when required; the backend exchanges, stores and retrieves credentials automatically.

- [ ] Add authenticated admin controls for Connect Instagram, Reconnect Instagram and connection status. Keep credentials and token exchange exclusively server-side.
- [ ] Implement the Facebook Login authorization and callback flow for the existing integration. Configure the actual deployment's redirect URI, validate a short-lived, single-use OAuth state bound to the authenticated administrator, and request only the permissions needed for the linked Page and Instagram professional account.
- [ ] Exchange fresh authorization for the appropriate credential and verify the linked account before replacing the active connection. Failed or cancelled authorization must preserve a still-valid connection.
- [ ] Store credentials encrypted in MongoDB, with the account/app association, token type, actual token expiry, data-access expiry and validation timestamps. Keep the encryption key in server environment configuration; never expose credentials in admin API responses, logs or browser storage.
- [ ] Load the stored connection after restarts and across server instances. Use the existing environment token only as an explicit initial bootstrap or migration source; do not rewrite `.env` at runtime or silently replace a newer stored credential with an older environment value.
- [ ] Add a scheduled connection check independent of Works page visits, with bounded retries and coordination across server instances. Attempt only the exchanges or renewals supported by the selected token type. Do not assume repeated Facebook user-token exchange guarantees indefinite renewal.
- [ ] Display the authoritative connection state and expiry in administration. Show a reconnect requirement when Meta requires fresh consent or reports an expired/revoked credential; never manufacture a later expiry or promise permanent unattended access.
- [ ] Preserve public feed loading, retry, empty and failure states. Keep a still-valid credential usable during transient Meta outages; stop using it at its real expiry. Keep public Instagram failures separate from admin-session authentication.
- [ ] Add isolated tests for OAuth state rejection/replay, callback authorization, exchange failures, account mismatch, encrypted persistence, restart recovery, concurrent updates, outage backoff, expiration/revocation and reconnect recovery. Verify the real Meta configuration separately without committing credentials or submitting bookings.

Acceptance: after initial authorization, normal server restarts and credential storage require no manual token copying or `.env` edits. Owner involvement is limited to Meta sign-in/consent when required. Do not mark this complete until callback security, persistence, actual API authorization and reconnect recovery are verified.

## Cloudflare Worker and R2 migration

- Replaced the Express runtime, routes, middleware and request/response handlers with a Hono module Worker. Retained field-validation chains through their standalone `.run()` API and preserved existing booking, slot-locking, auth, schedule and Instagram endpoints. Express itself is removed.
- Upgraded to Workers-compatible Mongoose 9, with connection-owned models resolved in request-local AsyncLocalStorage. A database-owning Durable Object retains MongoDB connections; no socket or model connection is copied between Worker request contexts. Default application indexes are explicitly initialized by a local utility, not auto-created on every request.
- Streamed single-file multipart uploads use Busboy, Web/Node stream bridges, a bounded signature prefix and R2 `FixedLengthStream`. The actual size must match `X-File-Size`; maximum 20 MiB, JPEG/PNG/WebP. The parser does not call request.formData(), collect full-file buffers, or write temporary files. Rejected uploads drain remaining multipart data without buffering and remove the generated object key.
- Booking references are now R2 key strings. API serializers provide media URLs to the existing admin/receipt shape. The browser uploads FormData before booking submission and no longer compresses/base64-embeds reference files. Old object/base64 records require the explicit migration utility on a backed-up test copy before production cutover.
- Cloudflare rate-limit bindings cover uploads, login and general API traffic. Cron replaces the process timer; background notification promises are attached to the Worker lifetime. Brevo HTTPS replaces SMTP. Native fetch replaces Axios in the backend.
- Instagram token files are removed from runtime behavior. Successful token replacements can be encrypted with AES-GCM in MongoDB and loaded after restarts when TOKEN_ENCRYPTION_KEY is configured. Without that key they remain memory-only. Full admin OAuth Connect/Reconnect and scheduled Instagram renewal remain future work, as above; no guarantee of perpetual renewal is made.
- Complete bindings/configuration are in `backend/wrangler.toml`; local placeholder secrets are in `backend/.dev.vars.example`; setup, local tests, Atlas/R2/Brevo credentials, legacy migration and deployment are documented in `backend/CLOUDFLARE_SETUP.md`.
- Verification: Wrangler dry-run bundles the module successfully; the local Worker boots; multipart >3 MB writes to local R2 and reads back identical bytes; invalid signatures/empty uploads/wrong lengths are rejected. Backend tests cover validation, authentication boundaries, string-only references, streaming cleanup and Instagram failures. Frontend lint/build and updated payload tests pass. Backend dependency audit reports zero vulnerabilities after removing obsolete HTTP/Express/SMTP dependencies.
- Remaining launch verification: actual Atlas connectivity and database workflow integration, email delivery, deployment-specific origins, CPU budget for bcrypt, existing-reference migration and Cloudflare account provisioning. Wrangler emits a MongoDB dependency `whatwg-url` default-export shim warning; local module startup succeeds, but live cluster verification is deliberately not claimed. No real secrets, production data, cloud resources, deployment or commit were created by this migration.

### Worker HTTP transport correction

- Reproduced the reported Instagram `status: null` in an isolated real workerd runtime without credentials. The transport's `redirect: 'error'` option throws a TypeError before sending any request: Workers supports `follow` and `manual`, not `error`.
- Replaced it with `manual` and explicit rejection of 3xx responses. Credentials are never forwarded to a redirect target. JSON-decoding failures now retain the upstream HTTP status instead of appearing as a network error with no status. Instagram/token logs include error name, error code, cause code and upstream status without logging raw transport messages or credentials.
- Added three HTTP regression tests. All 20 backend tests pass; Wrangler dry-run build passes. The same isolated workerd request now reaches Meta and receives an HTTP response (403 without credentials), rather than failing locally with TypeError. This verifies transport compatibility, not authenticated feed access. No environment changes or deployment performed.

### Matched route parameter correction

- Reproduced `/api/public/availability/2026-11-10` returning 400 in the native Hono stack. Global input middleware captured an empty parameter object before Hono exposed the matched route's `:date`; date validation therefore received an absent value.
- Validation now captures `c.req.param()` at the matched route before executing the standalone validation chains. This also corrects MongoDB ID validation on mounted booking routes. Invalid dates/IDs still return 400; availability/business rules are unchanged.
- Added mounted-route regression tests for the exact reported date and for booking IDs, including malformed inputs. All 22 backend tests pass. No database records, environment values or deployment changed.
