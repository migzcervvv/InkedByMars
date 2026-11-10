# Inked By Mars: frontend audit and full redesign brief

Historical baseline. The subsequently approved three-page red/gold implementation is recorded in `GOALS.md` and `PLAN.md`; those files supersede this audit's proposed palette and route plan.

Audit date: 10 November 2026. Scope: existing source, assets, build, lint, homepage at three widths, and nine additional route entry screens at desktop and phone widths. Application source and dependencies were not changed. The changes accompanying this report are Git ignore rules and removal of previously tracked local files from the Git index. No commit was created.

## Decision

Rebuild the complete frontend around **Mars's flash sheet becoming a moving portfolio poster**. Replace the current brown/red palette, three-font system, image collage hero, section compositions, navigation, footer, forms, calendars, gallery presentation, and admin presentation. Keep React, Vite, Tailwind v4, routes, API contracts, authentication, booking rules, and working data flows.

The three largest improvements are:

1. Put Mars's recognizable work at the center of the site. Use the branded flash sheet and individual tattoo photographs as the hero's material, with a restrained scroll parallax background and one clear title.
2. Establish one CSS token system shared with Tailwind: two typefaces, five type sizes, semantic colors, consistent margins, readable body text, and complete interaction states.
3. Recompose every route around its job. Correct clipped phone layouts, obstructed titles, ambiguous booking states, and inaccessible controls as part of that rebuild.

## Existing stack and styling

| Area | Evidence | Consequence |
| --- | --- | --- |
| Framework | React 18.3.1, React Router 6, Vite 8; `client/package.json` | No framework migration is needed. |
| Tailwind | v4.3.0 in lockfile; `@theme` in `client/src/index.css` | The project already supports centralized CSS with Tailwind. |
| CSS entry | `main.jsx` imports `index.css` | Preserve one global stylesheet entry. |
| Competing theme definitions | `index.css` and `tailwind.config.js` both define colors/fonts; no `@config` reference was found | The legacy JS configuration is not automatically active in v4. Editing it can appear to do nothing. |
| Scattered styles | Three Instagram CSS files, utility strings, inline colors and sizes, hard-coded rgba values | A palette change in one place does not propagate consistently. |
| Legacy CSS | `App.css` contains Vite starter selectors and undefined theme variables; no import found | Remove obsolete code during implementation, after import/reference checks. |
| Build integration | Tailwind Vite plugin and Tailwind PostCSS plugin both configured | Consolidate to one supported processing path during implementation. This audit did not establish duplicate output. |
| Animation | GSAP/ScrollTrigger and Framer Motion; global cursor and route transitions | Assign clear ownership; reserve scroll choreography for GSAP and local state feedback for Motion/CSS. |
| Route loading | Public and admin pages are imported eagerly in `App.jsx` | Public visitors download admin code and both animation systems in the initial bundle. |

Tailwind's current documentation confirms that v4 does not automatically detect JS config files and that `@theme` creates both CSS variables and utility classes: [upgrade guide](https://tailwindcss.com/docs/upgrade-guide), [theme variables](https://tailwindcss.com/docs/theme).

## Measured baseline

The skill's inspector ran against the unchanged homepage. All nine generated homepage screenshots were opened, including the full scroll contact sheets. The first sandboxed attempt timed out at `Page.enable`; the successful run used a temporary headless browser outside that restriction.

| Measurement | 1440 px | 768 px | 390 px |
| --- | --- | --- | --- |
| Hero headline | 3 lines, 72 px | 3 lines, 38.4 px | 3 lines, 27.3 px |
| Experience heading | 3 lines | 3 lines | 5 lines |
| Page height | 7,015 px | 9,006 px | 10,067 px |
| Reported viewport lengths | 7.8 | 8.8 | 11.9 |
| Predominant running text | 15 px | 15 px | 14 px |
| Moving elements recorded | 51 | 51 | 49 |
| Document horizontal overflow | 0 | 0 | 0 |
| Broken image elements | 0 | 0 | 0 |

Additional measurements: three typefaces; 15 font sizes from 9 to 128 px; 31 tiny tracked uppercase labels; 20 text blocks below 13 px; nine eyebrow labels; 29 decorative thin rules; three resting image shadows; 18 backdrop-blur surfaces. Several labels measure 2.7:1 contrast. Desktop hero image coverage is 12%. There is no video.

Inspector result: **13 FAIL, 14 WARN**. Source taste lint: **171 FAIL, 42 WARN across 88 files**. These are tool findings, not 171 independently verified defects: the source scan includes unused code, actual form/table borders, decorative numbers, and checkmarks in comments. Admin screens must use the app-screen rules rather than every public-page rule.

The inspector's `small-title` warning reads the unstyled 16 px `h1` parent, while its child spans actually render at 72/38.4/27.3 px. Use the child-span measurements above. Zero document overflow also does not establish that content fits: the contact screen is visibly clipped because ancestors hide overflow.

Artifacts remain locally under ignored `.taste-skill/`:

- `before/report.json`, `home-inspect.txt`, and `before/*` screenshots.
- `routes/report.json`, route screenshots, and `routes/overview-{1440,390}.jpg`.
- `source-lint.txt`, `eslint.txt`, `build.txt`.
- `design-options.txt`, `proposed-direction.txt`, and `proposed/direction.json`.

## Findings by priority

### High: broken or misleading user flows

| Finding | Evidence | Redesign requirement |
| --- | --- | --- |
| Direct confirmation visit renders the error boundary | `pages/BookingConfirmationPage.jsx:7,20` reads `state?.booking`, then dereferences `booking.preferredDate`. Reproduced at both widths. | A successful request has a stable receipt; missing state has a deliberate recovery view. Retrying the same missing-state render must not repeat the crash. |
| Phone contact content is clipped | `routes/contact-390.jpg`; the title, email and social values extend beyond the right edge. `ContactRow` uses a non-wrapping flex row; global overflow hiding masks the problem. | Stack labels and values on phones, allow long addresses to wrap, use `min-width: 0`, and size titles within the actual measure. |
| Privacy title is under fixed navigation | `routes/privacy-policy-390.jpg`; `PrivacyPolicy.jsx` starts at `py-10` beneath an 80 px fixed header. | Shared header-offset and scroll-margin tokens on every public route. |
| Unknown availability is presented as available | `AvailabilityCalendar.jsx:90-121` treats a missing day entry as available. The booking screenshot shows an error banner alongside available-looking dates. | Explicit unknown/loading/error states; no availability claim until data is loaded. The absence of time slots must not imply that a failed request means a fully booked day. |
| Reference upload and API limits disagree | `imageCompressionService.js:27` allows 2 MiB; already-WebP images within that limit pass through. Backend validator caps each data URL at 750,000 characters. Base64 expands the data further. | Match the actual encoded payload limit, reject or recompress oversized results, and show an actionable field error. Four uploads also need a total request-size budget. |
| Upload failures are stored but not displayed | `BookingForm.jsx:80` sets `errors.uploadError`; no render references it. | Visible upload progress, per-file failure, retry/remove controls, and an announcement for assistive technology. |
| Request and confirmation language disagree | Frontend says “reserved” and asks users to check for confirmation; backend creates an `on-hold` booking and returns “Your booking is pending.” | Distinguish request received, temporary hold, payment/deposit action, confirmed appointment, conflict, and expired hold. Do not promise confirmation merely because a request succeeded. |

### High: accessibility and orientation

- No `prefers-reduced-motion` or `useReducedMotion` handling was found in frontend source. Hero motion, particles, parallax elsewhere, route wipes, and FAQ motion run without an explicit reduction policy. Preserve visible content and disable travel under reduced motion.
- `Navbar.jsx` opens a full-screen mobile menu without focus trapping, Escape handling, or focus restoration. `Modal.jsx` and the active Instagram lightbox also lack a complete focus lifecycle and an accessible dialog name. The Instagram lightbox does handle Escape; keep that behavior.
- `AdminLayout.jsx` hides navigation label spans below the small breakpoint, with no `aria-label` on those links. An icon alone does not name the destination. Authenticated admin screens were reviewed in source, not entered with credentials.
- Booking fields have visual error text but lack `aria-invalid` and linked descriptions. `BookingForm` is a section with click handlers rather than a native form; Enter submission, autocomplete, required semantics, and focus movement between steps need deliberate treatment.
- `/about` has no `h1`, confirmed from the rendered DOM at both checked widths. Several public sections use styled paragraphs for their titles. Give each route a clear title and each content section a real heading.
- The native pointer is globally hidden on fine-pointer devices. Restore it, including on admin screens. A custom cursor is unnecessary to convey tattoo work and currently depends on JavaScript for visibility.

### Design and content

- The three-line hero is generic tattoo category copy. It does not lead with Mars or Las Piñas. The 390 px headline is too small to dominate; the tablet composition leaves the photographs separated by a large empty vertical region.
- The homepage spends substantial space repeating artist biography and studio philosophy from `/about`. Four identical specialization cards turn distinctive work into a component catalog. The FAQ then narrows into a long series of tiny low-contrast boxes.
- Section frames drift between `max-w-[1400px]`, `max-w-7xl`, `max-w-5xl`, `max-w-3xl`, and multiple inset values. The inspector finds nine left-edge anchors and unequal measured content margins of 92 and 131 px at desktop.
- `Hero.jsx:132` assigns `backgroundImage: "paper-texture.jpg"`, which is not a valid CSS image value. The actual file is `src/assets/paper-texture.jpg`, outside the public root. Resolve the asset through an import if it survives the new art direction. The inspector's image-element check cannot detect this CSS failure.
- Existing hero motion follows `mousemove`; it is not a scroll parallax background. Scroll parallax exists in `PortraitBio`, but not in the requested hero role.
- `artist.jpg` is a nine-panel portfolio collage, not the single portrait described by its alt text. `sample.jpg` is a branded flash sheet, not “Mars working in her private studio.” Both were visually inspected.
- The hero's warm editorial photographs differ from the portfolio's presentation and subject matter. Their provenance and relationship to Mars are not documented. Existing files are available assets, not proof of authorship or permission.
- `Footer.jsx` and `ContactPage.jsx` publish different email addresses. Centralize contact content once its authoritative value is established.
- `Milestones.jsx` asserts “300+” pieces and “98%” return clients; `PortraitBio` repeats the piece count. No supporting source is present in the audited frontend. Treat these as unverified, as well as the 2019 start year, biography, and quarterly scarcity claim.
- Pricing, deposit amount/deadline, response time, design turnaround, touch-up promises, and preparation/aftercare text are hard-coded in FAQ/data files. Some preparation timing differs between answers. These need approved source content before publication; this audit does not validate medical guidance or business policies.
- `index.html` references `/og-image.jpg`, which is absent from `public`, and declares a JPEG favicon as SVG. Route titles exist, but descriptions and social metadata are generic across routes.
- The active gallery is the Instagram feed. `components/gallery/*`, `galleryService.js`, and mock gallery data form a separate path not used by `GalleryPage`. Do not redesign the inactive path and assume the live gallery changed.
- The active gallery filters by media format, not tattoo style. Preserve its API data and retry behavior; add style filtering only when real metadata exists.
- Login displays a permanently disabled Facebook option, while `App.jsx` loads the Facebook SDK and logs a page view on every route. Remove nonfunctional affordances and scope optional SDK loading to the feature that needs it. The privacy copy must accurately describe actual data collection; this is a source-content mismatch, not a legal compliance determination.

## Subject inventory for the redesign

These come from source and visually inspected assets. They are design inputs, with business claims still requiring verification.

1. The name Inked By Mars and the handwritten Mars seal in the existing logo.
2. The branded flash sheet in `sample.jpg`, including its vertical “INKED BY MARS” signature.
3. That sheet's recurring illustrated faces, flowers, ribbons, butterflies, and dagger.
4. The blue fish visible in the portfolio collage and `minimalistic.jpg`.
5. The red spider-lily work visible in the collage and freehand example.
6. The long dagger-and-chain placement shown in the custom example.
7. The mix of black linework and selective color in the actual local portfolio images.
8. A private, appointment-only practice described in the existing content.
9. BF Resort, Las Piñas City, and the existing map destination.
10. Two distinct Instagram identities: `@inkedbymars` and `@flash.designs.by.mars`.
11. The existing consultation/reference-image workflow and calendar-led booking.
12. The distinction between custom work, freehand work, minimalistic work, and flash in current content.

Do not invent Mars imagery from the planet, astrology, generic skulls, or roses merely because those are familiar tattoo motifs. The existing illustrated flash sheet gives the site a more defensible identity.

## Three complete design directions

The skill dealt `dense-tiles`, `contact-sheet`, and `pinned-poster`. These are alternatives for the entire frontend, not three hero variants. Only the recommended direction was expanded into a full sheet; alternative palettes and type choices below are proposals, not rendered or measured designs.

| Direction | Visual system | Hero and composition | Site-wide application |
| --- | --- | --- | --- |
| **Mars Flash Poster**; recommended; `pinned-poster` | Carbon `#101010`, chalk `#F5F5F2`, graphite `#202020`, pale blue `#9FD3EE` for the main action. Unbounded 800 display, Onest 400/500 text. Square media and controls. | Mars's branded sheet becomes one dominant parallax background crop. Stable two-line title; a short pinned sequence moves from sheet detail to finished tattoo. | Large paired work images, compact biography, readable process and FAQ, quiet calendars/forms, full-width typographic close. Light neutral admin canvas with the same Onest and semantic status tokens. |
| **The Flash Archive**; `contact-sheet` | White `#FAFAF8`, black `#171717`, deep green `#145B46`. Proposed Barlow Condensed display and Source Sans 3 text. | Oversized name above an archive of real work. One flash-sheet image drifts slowly behind the opening composition; thumbnails remain fixed and readable. | Work-first gallery, captions with real metadata, editorial biography, concise process text, paper-like booking and admin screens. Requires enough individual approved images; the existing collage must not be treated as nine independent high-resolution originals. |
| **The Artist's Worktable**; `dense-tiles` | Cool white `#F0F2F2`, charcoal `#181A1A`, dark teal `#075C59`. Proposed Instrument Serif display and DM Sans text. | A fitted board of unequal areas: name, large flash sheet, finished tattoo, location and one booking action. One background image moves on scroll. | Unequal image/text blocks across public pages; dense, task-focused booking/admin views. Avoid equal icon cards, thin outlined tiles, or decorative clutter. More information visible immediately, less cinematic than the poster direction. |

### Recommended sheet and adaptations

Direction: **The pinned poster**, seed **2016025615**. Dealt type: **Unbounded / Onest**. One palette redraw: the initial “Sky and navy” with orange proposed an atmosphere unrelated to the local blackwork and flash assets; the redraw produced “Cobalt on sand.”

The proposed implementation maps that sheet's ground/ink/action roles onto carbon, chalk, and pale blue to remove the existing warm-brown system and let black linework lead. This material-based adaptation is explicit; those hex values were not the script's original palette. The final colors and all text/surface pairs still require contrast checks in the implemented design.

No photographs were downloaded, generated, or licensed during the audit. The sheet's automatically suggested Coast stock-photo set is unused and inappropriate for this identity. No replacement assets are claimed to be ready. The single-artist biography must not be padded into the sheet's multi-person portrait sequence, and the long process/contact scenes must be shortened to satisfy the skill's content, heading, and no-empty-screen rules.

**Idea:** On this page, Mars's signed illustrated flash sheet becomes a pinned portfolio poster whose details lead into the corresponding finished work.

**Live element:** select one of the four existing work categories, see approved examples, and carry the chosen interest into the booking brief. Match examples to verified metadata; preserve readable linked work when the interactive enhancement is unavailable. This is a proposed interaction, not an implemented feature.

### Homepage argument and replacement sequence

| Section | Claim and proof | Proposed composition |
| --- | --- | --- |
| Hero: “Inked By Mars” | Identify the artist and service immediately. Supporting copy: “Custom tattoos by Mars in BF Resort, Las Piñas. By appointment.” | One oversized title, dominant branded-sheet background, one “Request a session” action. Text is visible immediately. |
| “Selected tattoos” | Show the work a visitor is choosing the artist for. | One large full/detail pair, then a differently proportioned pair; link to the full gallery. No equal four-card feature row. |
| “Find your starting point” | The existing categories give visitors concrete ways to describe a piece. | Accessible category selector and large photograph, with the brief carried into booking. |
| “Meet Mars” | A person makes the work and sees each client privately. | Actual approved portrait, concise confirmed biography, location. No unsupported counters. |
| “From idea to appointment” | Explain the real path and set expectations. | Compact consultation/design/session/aftercare sequence with real work or process pictures where available. No four full-screen filler scenes. |
| “Before you book” | Answer cost, deposit, timing and preparation questions. | Approved answers set as readable text; collapsible supplementary answers use native details semantics where appropriate. |
| “Visit the studio” and footer | Provide place, contact and the next real action. | Location and map link, authoritative email, both social destinations, large returning name and legal links. |

The final copy deck must use verified claims. Proposed headings above are sample design copy; prices, business history, instructions and promises must not be invented to fill the layout.

## Full route coverage for implementation

| Route or surface | New frontend treatment | Behavior to retain or explicitly resolve |
| --- | --- | --- |
| Global navigation/footer | Plain opaque navigation; Work, About, Availability, Contact and one booking action. Phone menu with focus lifecycle. Typographic footer. | Existing destinations, active state, external links and mobile scroll locking. |
| `/` | Complete sequence above; tattoo-sheet parallax hero. | Booking/gallery entry, useful FAQ content. |
| `/gallery` | Work archive with large images, consistent crop families, readable captions and accessible lightbox. | Active Instagram service, media filters, load-more, retry, empty and error states. Curated local fallback only with approved provenance. |
| `/about` | One real title, approved portrait, meaningful biography and work-led process. | Useful current information; remove duplication, unverified statistics and mismatched images. |
| `/availability` | Readable month view, explicit timezone, textual states and a selected-day summary. | Date APIs, closed/booked/held distinctions and the booking link. Unknown data stays unknown. |
| `/booking` | Calm sequential booking layout; selected date/time stays visible; real form and clear upload states. | API payload, server validation, conflict recovery, attachment workflow, date refresh. Clearly state that selecting a date is not a server-confirmed hold. |
| `/booking/confirmation` | Stable request receipt, status-specific wording, next steps and safe direct access. | Submitted booking details. Use public-safe data only; do not persist sensitive references just to survive refresh. |
| `/contact` | Location and contact typography with values below labels on phones. | Both social links, mail action, map destination. One source of truth for contact values. |
| `/privacy-policy` | Comfortable reading column with header clearance and clear section headings. | Approved policy text; reconcile it with actual form fields/uploads/SDK behavior. |
| Unknown routes and errors | Designed recovery screen using the same type and button system. | Real navigation and recoverable error handling. |
| `/admin/login` | Neutral, accessible sign-in form with concise errors and visible focus. | Existing credentials flow, loading state, redirect. No decorative parallax; no permanently disabled social sign-in action. |
| `/admin` | Operational overview led by bookings needing attention and today's work. Onest, 24 px title, tabular figures, quiet surfaces. | Existing real totals and recent bookings. Do not invent dashboard metrics or growth. |
| `/admin/bookings` | Dense readable list/table, filters, persistent selected-record context and accessible detail dialog. | Status transitions, pending holds, existing pagination/filtering and server errors. |
| `/admin/schedule` | Day schedule with explicit open/closed/held states and clearly scoped actions. | Existing schedule API and server-side validation. |
| `/admin/availability` | Clear month selection and blocked-day editing with a visible save/result state. | Block/unblock behavior, loading, success/error messages. |
| `/admin/settings` | Readable grouped settings with one primary save action and unsaved-change handling. | Business-hours/settings payload and validations. |
| Shared components | Replace Button, inputs, status badges, loaders, menus, dialogs, calendar cells, notices and upload previews as one system. | Disabled, focus, selected, hover, loading, empty, error and success states. |

Public-page decoration rules do not erase operational structure: admin tables and real form controls may use quiet 1 px borders, small readable labels and compact rows. Public display typography and parallax do not belong in the admin workspace.

## Centralized CSS with Tailwind

Use `client/src/index.css` as the sole imported design-system stylesheet. It can remain one file initially; if it grows, CSS partials are imported through that entry only. Move the three Instagram stylesheets into the same layer structure and remove duplicate font/color declarations.

Order: font loading; Tailwind import; semantic theme variables; base styles; typography/grid rules; shared components; route-specific structures; motion and reduced-motion rules. Keep Tailwind for responsive layout and composition, with CSS owning the repeated design decisions. Runtime animation transforms may remain inline; static palette, font, radius, spacing and shadow choices may not.

Illustrative token bridge for the proposed dark public theme, **not an implemented change**:

```css
@import "tailwindcss";

:root {
  --site-canvas: #101010;
  --site-surface: #202020;
  --site-ink: #f5f5f2;
  --site-accent: #9fd3ee;
  --site-accent-ink: #101010;
  --site-display: "Unbounded", sans-serif;
  --site-body: "Onest", sans-serif;
  --frame-gutter: clamp(1rem, 2vw, 2rem);
  --header-height: 5rem;
}

@theme inline {
  --color-canvas: var(--site-canvas);
  --color-surface: var(--site-surface);
  --color-ink: var(--site-ink);
  --color-accent: var(--site-accent);
  --color-accent-ink: var(--site-accent-ink);
  --font-display: var(--site-display);
  --font-body: var(--site-body);
}

@layer base {
  body { background: var(--site-canvas); color: var(--site-ink); }
  :focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
}
```

Light sections and `.admin-shell` override the `--site-*` roles locally; utilities continue to reference those roles. Add semantic success/warning/danger/unknown colors rather than using brand color names as statuses. Set display, heading, lead, body and small type steps once. Body text is 16–20 px; public captions stay at least 13 px. Match one pair of outer margins across navigation and sections, with inner reading measures where needed.

Remove or explicitly retire the legacy JS theme rather than maintaining two sources of truth. Use one Tailwind build integration. Standardize image ratios and button shape. Keep necessary calendar/form borders, and eliminate decorative rules, shadows, glass panels, numbered ornaments and background gradients from public pages.

## Tattoo parallax hero specification

- Material: one approved photograph of Mars's signed flash sheet or actual work, large enough for the chosen crop. The existing `sample.jpg` is a 1080 px source with framing baked in; it can establish direction but is insufficient for an unrestricted crisp full-width 2x desktop background. Obtain an appropriate original before launch.
- Layers: static carbon ground; one oversized image plane; optional second layer only if a genuine corresponding artwork detail exists. No generic particle field, floating shapes, planet imagery or fake ink animation.
- Geometry: one hero of approximately `100svh`; an optional continuation capped at two additional screens. Text and action remain in document flow above the media, with a reserved readable area. Never move imagery over the heading or action.
- Movement: GSAP ScrollTrigger tied to the hero, translating the media by a small clamped amount, approximately 32–64 px on desktop. Overscan the image enough to avoid exposing an empty edge. The text does not follow the pointer. Use transforms; no layout-property animation or scroll hijacking.
- Phones: use an intentional vertical crop with title, supporting sentence, action and recognizable work in the first screen. Disable pinned continuation; reduce travel to 0–16 px or use the static version. Do not squeeze the desktop collage into the phone layout.
- Reduced motion: static image, immediate text and no pinned hold, clipping reveal, smooth-scroll requirement or translation. Clean up route-level triggers through the existing GSAP context.
- Resilience: content is visible in the unenhanced state. Only apply entrance states after enhancement is initialized. The React application's broader no-JavaScript limitation remains unless rendering architecture is changed separately.
- Performance: responsive AVIF/WebP where appropriate, real dimensions, eager/high-priority hero media, lazy loading below the fold, and font subsets. No new scrolling or 3D library is required. Split admin routes before adding more presentation code.

## Screenshot critique

```text
ROUND 1 (unchanged baseline; audit only)
Seen in one second: three warm editorial photographs beside italic tattoo-category words.
Idea (one sentence): a warm private-studio editorial treatment, with little specific to Mars.
Live thing: FAQ toggles and booking navigation; no work-specific interactive element on the homepage.
Layout words by section: hero=collage split / biography=split / work=four cards / experience=split / booking=centered statement / FAQ=narrow accordion / footer=four columns.
Scores: design 5.0 · usability 5.0 · creativity 4.0 · content 5.0 → overall 4.8.
Caps applied: inspector FAIL cap 6.0; three-line headlines and ornament cap 6.5; category-default concept caps creativity at 6. Neither cap raises the lower observed score.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. The tablet hero disconnects two small image clusters with a large void, while the phone title falls to 27.3 px. See before/tablet-fold.jpg and before/mobile-fold.jpg. Replace the collage with one dominant work image and a confidently sized title within two lines.
2. Important copy is tiny or subdued, especially specialization captions and FAQ category labels. See before/desktop-page-01.jpg and before/desktop-page-02.jpg. Use a five-step scale, full-ink body copy and fewer labels.
3. Subject-specific images are assigned the wrong roles: a collage stands in for a portrait and a flash sheet for a studio photograph. See before/desktop-page-01.jpg. Make the flash sheet the identity device, display individual work honestly, and use an approved portrait for biography.
```

These scores judge the existing homepage only. Proposed directions have not been rendered and receive no invented after score. No redesign fixes were applied to improve the baseline.

## Verification and limits

- `npm ci --no-audit --no-fund --cache ../.cache/npm`: passed using the existing lockfile. The default cache attempt failed on filesystem permissions; the workspace-local cache succeeded. No package files changed.
- `npm run build`: passed. Output: CSS 75.40 kB / 13.27 kB gzip; JavaScript 573.56 kB / 191.38 kB gzip. Existing warnings: a chunk over 500 kB and an ineffective dynamic import of the date utilities because they are also statically imported.
- `npm run lint`: failed with six existing errors: one non-component export in `AvailabilityCalendar`, one unused `tattooStyles` import, one effect state-update error in `AdminAvailabilityPage`, and three unused imports in `LoginPage`.
- Skill homepage inspector: completed at 1440/768/390; 13 FAIL and 14 WARN. Homepage image elements loaded, and no browser runtime exception was recorded there.
- Additional route entry capture: `/about`, `/gallery`, `/booking`, `/availability`, `/contact`, `/privacy-policy`, `/booking/confirmation`, `/admin/login`, and an unknown route at 1440 and 390. Both overview sheets were opened; the clipped contact and obscured privacy screens were also opened individually.
- The active gallery and availability APIs were unreachable during route capture. Their error states are observed; successful API responses, populated Instagram lightboxes and successful booking submission were not exercised. No booking was created, no credentials were submitted, and no authenticated admin action was performed.
- `git diff --check` and `git diff --cached --check`: passed.
- This is an audit, so existing failures remain. No after inspection, implemented parallax benchmark, full authenticated interaction test, or launch-ready accessibility claim is made.

## Git hygiene completed

- Added root `.gitignore` rules that apply throughout the repository; updated client and backend rules.
- Ignore `.env` and `.env.*`, including nested variants. Explicitly named `.env.example`, `.env.*.example`, `.env.sample`, and `.env.template` are permitted as sanitized templates only.
- Ignore dependencies, generated builds, caches, coverage, local logs/process output, editor artifacts and `.taste-skill` outputs. Package lockfiles and source assets remain trackable.
- Ignore `backend/.token-store.json` and its suffix variants; `tokenService.js` writes the Instagram access token there.
- Removed `backend/.env`, `client/.env`, and the local `client/.vite-dev.err` from the Git index with `git rm --cached`. Local files remain present. The staged deletions are the intentional untracking operation; no commit was made.
- Verified actual environment paths, nested environment probes, generated output and token-store paths with `git check-ignore`. Verified sanitized example names remain trackable. `git ls-files` no longer lists the two environment files.
- Existing commits still contain the previously tracked environment files. This operation does not erase historical contents or invalidate any credentials that were committed there.
