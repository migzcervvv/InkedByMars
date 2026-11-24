# Homepage verification

- PASS — Production build, ESLint and all nine client tests.
- PASS — Chrome checked 375 × 812, 768 × 1024, 1440 × 900 and 1440 × 600. Each viewport opened the menu, closed it with Escape, selected Flash and followed the booking CTA. No horizontal overflow or uncaught page errors were observed.
- PASS — With the desktop portrait response delayed by 1.6 seconds, Chrome observed a partial signature stroke, a completed handoff and a skipped intro on reload. The tablet check used reduced motion.
- Local measurements — LCP observations were 236 ms on the phone viewport, 364 ms on tablet, 732 ms on desktop and 204 ms on short desktop. Each is a single local Chrome run. Desktop portrait 50,414 bytes, mobile portrait 81,328 bytes, hand 33,944 bytes, seal 4,842 bytes. Production homepage chunk 47.87 kB gzip.
- UNVERIFIED — Field Core Web Vitals, sustained animation frame rate, physical-device touch testing and Lighthouse scores.
- Mosaic uses existing portfolio images as temporary tiles. Static layouts and semantic headings remain available with reduced motion.

Motion revision: Chrome verified the first-visit intro on normal-speed loads at 375 and 1440 px, all four scroll-selected style states in order, menu dismissal, and navigation through the booking CTA. At 768 px with reduced motion the intro and style pin were bypassed. Lint, production build and nine client tests passed. The earlier LCP figures predate this revision.

## Reference motion revision

- PASS — Reviewed both supplied videos. The loader draws lowercase mars over 2.5 seconds, rests for 270 ms, then travels to the measured seal over 1.15 seconds. The entry replays on refresh.
- PASS — Chrome production preview at 375, 768 and 1440 px showed a partial stroke, automatic dismissal, replay and keyboard dismissal on reload. Reduced motion showed the finished hero and an untransformed mosaic.
- PASS — At all three sizes, measured mosaic scale was about 2.14 at entry, 1.42 halfway and 1 at rest. Both chapter panels measured 0.94 scale when their tops were 62% down the viewport. Captured mosaic screenshots at all three widths.
- PASS — Client production build, lint and all nine existing tests. Homepage JavaScript chunk was 48.22 kB gzipped.
- UNVERIFIED — Physical-device frame pacing and field Core Web Vitals.

## Navigation push
- PASS — Reviewed navigation.mp4. The hero and header move left together while the right menu is uncovered. Chrome preview at 375, 768 and 1440 px returned the hero to its original position on Escape and restored focus to Menu. Verified immediate reduced-motion positioning and navigation to My Works.
- PASS — Client lint, production build and all nine tests. Physical-device frame pacing remains unverified.

## Style carousel
- Reviewed the 9.75-second carousel reference. Implemented overlapping panels with exposed vertical labels, scroll-linked horizontal travel, and a hold for each style.
- PASS — Chrome production preview at 375, 768 and 1440 px. At the beginning, midpoint and end of the Freehand transition, measured panel offsets were 199/99/0 px on mobile and 1145/575/0 px on desktop. Captured intermediate frames at all three widths.
- PASS — Exercised emulated touch scrolling and mouse wheel input, selected Flash by keyboard and Freehand under reduced motion. Build, lint and nine tests passed. Real-device touch inertia and frame pacing remain unverified.

## Studio footer
- PASS — Chrome production preview at 375, 768 and 1440 px showed the inset scroll entrance. Captured footer screenshots at all three widths. Verified keyboard pause, static reduced motion and the Privacy dialog.
- PASS — Production build, lint and all nine existing tests. Field performance and other browser engines remain unverified.

## Booking sequence

- PASS — Chrome preview at 375, 768 and 1440 px with mocked availability and booking responses. Verified only open times are offered, keyboard activation opens the brief, changing time preserves the draft, reduced motion skips the entrance, and the request reaches the receipt without email or phone. Captured the form at all three widths.
- PASS — Client build and lint, nine client tests and 40 backend tests. Live database writes and Instagram follow-up remain unverified.

## Booking intake verification, 2026-11-24

- PASS — The mobile calendar screenshot shows the complete month and its legend in the first 375 × 812 viewport. The full-screen studio-colored title marks the transition from scheduling to the tattoo brief.
- PASS — Chromium completed the form at 375 × 812, 768 × 1024 and 1440 × 720 with intercepted availability and submission responses. Tests covered Enter to continue, automatic category and size advancement, empty contact fields, optional notes and references, a mobile file selection with simulated upload, a rejected indexed reference and the receipt after retry. The tablet run used reduced motion.
- PASS — An isolated notification test captured a new-request email addressed to the configured studio account, verified the explicit recipient override and checked that disabling new-request delivery suppressed the message.
- PASS — Client lint, client production build, 9 client tests, 40 backend tests and Worker dry-run build. Booking route chunk measured 23.04 kB or 8.16 kB gzip. Local DOMContentLoaded measured 195 ms, 75 ms and 67 ms respectively in the final run.
- UNVERIFIED — Production database submission, delivery to Mars’s inbox, field Core Web Vitals and animation frame timing. Worker dry-run emitted warnings about observability.issue_detection and the whatwg-url compatibility shim.

## Instagram booking and availability

- PASS — Chromium at 375, 768 and 1440 px showed closed dates, read-only open times and the Instagram link using simulated availability. The tablet run used reduced motion.
- PASS — Client lint and production build, backend suite (40 tests) and Worker dry-run build. The public booking route chunk measured 6.58 kB (2.55 kB gzip).
- UNVERIFIED — Authenticated save against the production database, production deployment, field performance and admin dialog visual inspection.
