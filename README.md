# Inked by Mars

Inked by Mars is the portfolio and booking site for Mars, a tattoo artist in BF Resort, Las Piñas, Philippines. Clients can browse work, check availability and send a tattoo request. The studio reviews requests and manages its calendar in a private admin panel.

## Pages

| Page | Purpose |
| --- | --- |
| `/` | Artist introduction, tattoo styles and studio contact information |
| `/booking` | Availability calendar, appointment request and receipt |
| `/works` | Portfolio pulled from the studio’s Instagram account through the backend |
| `/admin/bookings` | Review holds and pending requests, confirm or decline them, and manage existing appointments |
| `/admin/calendar` | View the daily agenda, block whole days or time ranges, and remove studio closures |

## How bookings work

1. The client chooses an available date and time starting tomorrow in Philippine time.
2. They describe the tattoo, enter contact details and optionally attach up to four reference images.
3. After reviewing and sending the request, they receive a receipt. The API checks availability again and places a temporary hold if the slot is still open.
4. An administrator reviews the request, then confirms an explicit date and time range or declines it with a reason. Unconfirmed holds expire automatically.

## Reference images

The browser converts JPEG, PNG and WebP inputs into WebP before uploading. It accepts source files up to 20 MiB and sends images with a longest edge of at most 1280 px and a size of at most 192 KiB each. Supabase stores the optimized files in a private bucket. MongoDB stores their object keys, and the Worker serves the preview URLs.

The cleanup job makes attached references eligible for deletion **14 days after the appointment start in Asia/Manila**. The date and time from a confirmed or rescheduled appointment replace the original preference. If a request is never confirmed or is cancelled, its last recorded appointment time is used. The five-minute job removes due images and clears their keys from the booking. Failed deletions are retried on later runs. An image attached to multiple bookings stays in storage until its last booking reference is removed. An upload left unattached to a submitted request has no appointment to calculate retention from. [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) · [Supabase object deletion](https://supabase.com/docs/guides/storage/management/delete-objects)

## Stack and hosting

| Layer | Where it runs |
| --- | --- |
| React 18, Vite 8, Tailwind CSS 4 and GSAP | Static frontend configured for Netlify. The build output is `client/dist`, with a fallback for client-side routes. |
| Hono API | Cloudflare Workers. A Durable Object owns the Mongoose 9 database connection. Wrangler configures deployment and scheduled cleanup. |
| Bookings, schedules and administrator accounts | MongoDB Atlas |
| Booking reference images | Supabase Storage, accessed through the Worker |
| Portfolio feed | Meta Graph API, called by the backend |
| Booking email | Brevo HTTPS API when email notifications are enabled |

Frontend pages and booking flow are in `client/src/features`. Shared UI lives in `client/src/components` and site styles in `client/src/index.css`. Backend routing, controllers and service logic are in `backend/src`. Provider and runtime bindings live in `backend/src/bindings`.

## Run locally

Use Node.js 22.12+ and npm. Set up an isolated MongoDB Atlas database and Supabase test bucket using the [Worker setup guide](backend/CLOUDFLARE_SETUP.md). It covers credentials, index initialization, administrator seeding and testing before deployment.

From the repository root, start the API in PowerShell:

```powershell
cd backend
npm ci
if (!(Test-Path .dev.vars)) { Copy-Item .dev.vars.example .dev.vars }
# Fill in the test settings in .dev.vars before starting Wrangler.
npm run dev
```

In `client/.env.local`, set the API origin:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8787
```

In a second terminal, run `npm ci` and `npm run dev` from `client`. Open the Vite URL and include that exact origin in the Worker's local `CLIENT_URL`. The API health check is [localhost:8787/api/health](http://127.0.0.1:8787/api/health). Keep credentials in ignored local files or Wrangler secrets.

## Verification

- From `client`, run `npm run lint`, `npm test` and `npm run build`.
- From `backend`, run `npm test` and `npm run build`. The Worker build is a Wrangler dry run.
- After the Worker build, run `node scripts/test-storage-worker.cjs` from `backend` to verify uploads and reads against an isolated storage fixture.

See [GOALS.md](GOALS.md) for acceptance criteria and [PLAN.md](PLAN.md) for implementation status.
