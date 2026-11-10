# Implementation plan

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
