# Inked By Mars engineering instructions

## Scope and product

- Maintain three primary public pages: Home (`/`, including the artist biography and studio contact), Booking (`/booking`, including availability, request and receipt), and Works (`/works`, connected to the existing server-side Instagram integration).
- Keep authenticated administration at `/admin/*`. Redirect older public URLs to the matching page/section. Privacy is a shared accessible dialog, not a fourth primary page.
- Preserve the React 18 / Vite 8 / Tailwind 4 frontend. The backend uses Hono on Cloudflare Workers, MongoDB through Mongoose 9 and a database-owning Durable Object, and Cloudflare R2 for media. Do not reintroduce an Express server or replace working integrations with mock services.
- Use `GOALS.md` for acceptance criteria and `PLAN.md` for implementation status and verification evidence.

## Architecture

- `client/src/app`: route composition, metadata, compatibility redirects.
- `client/src/features`: public page composition and feature-specific state. Booking owns its calendar/request/receipt lifecycle; Works owns feed presentation.
- `client/src/components`: shared layout, accessible UI primitives and reusable domain components, including the same calendar used in public booking and administration.
- `client/src/api`: HTTP transport and endpoint adapters only. `services` handles transformation/file processing; `hooks` handles reusable asynchronous state; `config` contains public business configuration.
- `backend/src`: retain routes -> validators/middleware -> controllers -> services/models. Instagram credentials, token refresh, slot locking, email and authentication stay server-side.
- `backend/src/bindings`: Worker environment scope, database model resolution, native HTTP and encrypted credential persistence. R2 uploads stream through the binding; never buffer whole files with formData()/arrayBuffer() or store base64/binary media in MongoDB. Keep secrets in ignored .dev.vars locally and Wrangler secrets remotely.
- Keep one source for contact details, brand data and supported work categories. Do not duplicate content inside page components.

## Design and motion

- Follow the supplied Mars wax-seal logo: wax red, deep wine, gold lettering and neutral paper. The logo is an existing asset and must not be recolored. Slate blue from the reference background is a supporting brand color, not a primary action color.
- Centralize tokens, base styles, shared component styles and motion rules in `client/src/index.css`. Tailwind owns responsive composition. Use semantic tokens, not new hard-coded palettes in JSX or per-component CSS files.
- Use Unbounded for public display titles and Onest for reading and controls, with usable fallbacks. At most two typefaces, five semantic type steps. Public headings fit within two lines at 1440, 768 and 390 px.
- Use Mars's actual local work and the live Instagram feed. Do not invent reviews, statistics, booking availability, tattoos, credentials or business policies. Existing portfolio assets have inherited provenance; document any asset requiring owner confirmation.
- Build tattoo-inspired motion from artwork: the flash sheet opening into view, freehand movement, subtle parallax, a wax-seal press and work-image reveals. Use existing GSAP and CSS. No scroll hijacking or custom pointer. Motion must not block reading, booking or keyboard use.
- Respect reduced motion. Scope and clean up every animation. Content must be visible without animation initialization. Public display effects do not run on operational admin screens.

## Interaction and data

- Unknown or failed availability is never displayed as available. Prevent stale range/date responses from replacing newer selections.
- A selected slot is a preference, not a server-side hold. Display request/hold/confirmed states truthfully. Resolve conflicts through server responses and refresh availability.
- Keep form inputs across date/time changes. Use native forms, visible labels, linked errors, upload progress/failures and keyboard navigation. Verify streamed upload type and byte count against server limits; booking JSON carries only validated R2 object keys.
- Never persist booking PII, references or credentials in new client storage. Receipt state may remain in component memory; a reload gets a deliberate recovery state.
- Instagram uses backend endpoints; no tokens or Graph calls in the browser. Preserve retry, loading, empty and failure states. Do not present local photographs as a successful live Instagram fetch.
- Dialogs require an accessible name, focus containment, Escape handling and focus restoration. Mobile navigation must name each destination.

## Security and workflow

- Never commit `.env`, `.env.*` values, token stores, credentials, logs, dependencies, builds or browser audit output. Sanitized explicitly named example templates are the only environment-file exceptions.
- Preserve local environment files and pre-existing user changes. Do not commit, push, publish, deploy, rewrite history, or mutate production data without user authorization.
- Do not read or print secret values to diagnose frontend behavior. No authenticated production actions or real booking submissions during QA.
- Keep audit artifacts in ignored `.taste-skill/`. No new dependencies without a concrete need; use the lockfile and existing tools.
- Run `npm run lint` and `npm run build` in `client`. Verify the public experience at desktop, tablet and phone widths, reduced motion, old-route redirects, keyboard interaction and representative API states. Use isolated test fixtures only in the test browser; do not ship fake APIs.
- For substantial behavior changes, add focused tests that can catch a regression. Do not add tests that merely mirror CSS or implementation details.

## Communication

Use direct, factual language. No emojis, filler, hype, soft offers or engagement prompts. Report the completed change, verification and remaining limits. Do not ask optional questions when the current brief supports a reasonable implementation decision.
