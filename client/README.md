# Inked by Mars frontend

React 18, Vite 8 and Tailwind 4. The public experience has three pages:

- `/`: artwork, artist introduction, styles, process and studio contact.
- `/booking`: verified availability, client brief, references, review and inline receipt.
- `/works`: the server-backed Instagram feed, media filtering and viewer.

Protected operations remain at `/admin/*`. Legacy URLs redirect to the relevant public page or section. Privacy is a shared dialog.

## Run

Use Node 22 or newer. Install the existing lockfile with `npm ci`, then run `npm run dev`. `npm run build` produces `dist/`; `npm run preview` previews that output.

The existing Express backend runs separately on its configured port. The public client configuration is `VITE_API_BASE_URL` (the backend origin, without `/api`, default `http://localhost:5000`). Never put Instagram tokens, MongoDB credentials, email passwords or signing keys in a Vite environment variable. Keep actual `.env` files local.

## Check

- `npm run lint`
- `npm test`
- `npm run build`

The focused Node tests cover unknown/closed availability, booking validation and the existing server payload contract. Browser QA uses isolated fixtures recorded in the root `PLAN.md`; no fake API ships with the site.

## Code boundaries

- `src/app/`: routing and compatibility redirects.
- `src/features/studio/`: Home composition and artwork motion.
- `src/features/booking/`: combined booking state and server payload model.
- `src/features/works/`: Instagram page and media viewer.
- `src/components/`: shared layout/UI and reusable booking/admin components.
- `src/api/`: one Axios transport and endpoint adapters.
- `src/hooks/`: cancellable/latest-response availability and Instagram state.
- `src/config/studio.js`: public identity, contact and content source of truth.
- `src/index.css`: brand tokens, Tailwind theme, components, responsive layout and reduced-motion policy.

Fonts are self-hosted in `public/fonts/`, with their SIL Open Font License files. Only the Tailwind Vite plugin processes Tailwind. Existing portfolio/brand assets are retained; confirm image provenance and studio content before launch.

## Integration behavior

Availability is never invented when the backend cannot connect. A selected time is a preference until the server accepts a request; the receipt distinguishes review from confirmation. Reference processing checks the 750,000-character server limit. Draft data stays in component memory and is not added to client storage.

Instagram is accessed through the existing `/api/instagram/*` backend endpoints. Tokens and Graph API refresh stay on the server. Outages show an honest retry/direct-Instagram view. Local portfolio images are not passed off as a successful Instagram response.

See the root `AGENTS.md`, `GOALS.md` and `PLAN.md` for project constraints, acceptance criteria and verification evidence.
