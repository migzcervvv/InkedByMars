# Inked By Mars redesign goals

## Product outcome

A recognizable red-and-gold tattoo portfolio with three public destinations: Home with about/contact, one Booking page with availability and the complete request flow, and Works connected to the existing Instagram account integration.

## Acceptance criteria

- [x] Brand uses the Mars wax seal, red/gold palette, deliberate typography and centralized CSS/Tailwind tokens.
- [x] Home shows real work prominently, an honest artist introduction, one useful style interaction, concise booking information and studio contact.
- [x] Booking includes month/date selection, verified times, client/tattoo details, reference images, review, validation, server conflict handling and an inline request receipt.
- [x] Unknown/loading/error availability never appears open. Rapid month/date changes cannot show stale responses.
- [x] Works uses backend Instagram endpoints, handles photos/reels/carousels, and supplies loading, empty, retry and outage states without fabricated feed data.
- [x] Public navigation contains only Home, Works and Booking. Old about/contact/availability/gallery/confirmation URLs recover intentionally.
- [x] Protected admin routes and backend API contracts remain intact and use shared primitives/calendar where appropriate. Login, protection and calendar verified with isolated fixtures.
- [x] Artwork parallax and stencil-inspired image reveals are expressive, responsive and disabled or simplified under reduced motion.
- [x] Home has no hero drawing controls, secondary hero logo, artist-image caption or redundant style-image captions. Portfolio images stay below the viewport height, and the style selector retains its booking links.
- [x] No clipped text, horizontal overflow, covered headings, missing local image assets or browser exceptions in the checked public layouts at 1440, 768 and 390 px.
- [x] Keyboard-accessible mobile menu/dialogs, semantic forms and actionable errors.
- [x] Frontend lint/build pass; regression checks exercise real state transitions through isolated browser fixtures.
- [x] Environment files remain local and ignored. No commit, deployment or live data mutation.

## Constraints and launch verification

- Retain the existing stack and server-owned business rules. No fake booking backend or new Instagram credentials.
- Verify real Instagram credentials, MongoDB reachability, email delivery and production booking against the owner's deployment separately; local fixtures prove interface behavior only.
- Existing prices, biography, logo/portfolio ownership and contact details require owner confirmation where the repository has conflicting or unsupported claims. Do not add new promises.
