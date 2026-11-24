# Master Prompt — Concept-led Website

Use after placing `AGENTS.md` at the repository root. Replace each bracketed value, or explicitly write `not supplied`.

```text
You are acting as a creative director, interaction designer, and senior frontend engineer. Read AGENTS.md and inspect the repository before proposing changes.

PROJECT
PROJECT
- Site type — Tattoo artist portfolio and appointment-request site, with a private studio admin panel.
- Brand or product — Inked by Mars is the portfolio and booking site for Mars, a tattoo artist offering custom, freehand, minimalistic, and flash tattoos by appointment in BF Resort, Las Piñas, Philippines.
- Audience — Prospective clients who can travel to the studio, including first-time clients exploring styles and returning clients who already have an idea. They need to see Mars’s work, find an available time, and describe the piece they want. Studio staff use the private admin panel to review requests and manage availability.
- Primary business goal — Submit a tattoo appointment request through Request a session. The studio reviews each request before confirming the appointment.
- Emotional target — Proposed. Feel comfortable bringing an unfinished idea and confident that Mars will help shape it. Real tattoo photography shows how the work sits on the body, and clear booking copy sets expectations for what happens after submission.
- Most important message — Mars draws tattoos for the person who wears them. Start with your own idea or one of Mars’s flash designs.
- Real available content — Artist introduction, style descriptions, booking process, FAQs, studio contact and directions, Mars’s wax-seal logo, artist portrait, local tattoo photography, and an Instagram-backed portfolio that supports photos, reels, and carousels. The booking flow uses studio availability and accepts optional client reference images.
- Existing repository and framework — An existing React 18.3, Vite 8, Tailwind CSS 4.3, GSAP 3.15, and React Router 6.30 application. Public routes are Home, Works, and Booking. Protected routes handle requests, the calendar, and team accounts. Frontend features live in client/src/features, shared UI in client/src/components, and global styling in client/src/index.css. The backend uses Hono 4.13 on Cloudflare Workers and Mongoose 9 with MongoDB Atlas. [README](C:/Users/mcs/Desktop/Projects/InkedByMars/README.md) · [Frontend package manifest](C:/Users/mcs/Desktop/Projects/InkedByMars/client/package.json) · [Backend package manifest](C:/Users/mcs/Desktop/Projects/InkedByMars/backend/package.json)
- Build skills and resources — Advanced project complexity. Existing resources include brand assets, tattoo photography, local Onest and Unbounded fonts, an established booking and admin workflow, and automated checks. Team size, roles, and individual skill levels are unconfirmed.
- Devices and assistive technology — Mobile and desktop are equally important. Verify at about 375, 768, and 1440 CSS pixels and on short desktop viewports. Support keyboard and touch operation, visible focus, screen-reader labels and status announcements, meaningful image alternatives, readable contrast, and reduced motion. Keep browsing and booking usable without hover or animation.
- Deadline, hosting, and performance limits — No deadline is documented. The frontend is configured for Netlify and the API for Cloudflare Workers. MongoDB Atlas stores application data and Supabase stores private booking references. Live deployment status is unverified. Project field targets at the 75th percentile are LCP ≤ 2.5 s, INP ≤ 200 ms, and CLS ≤ 0.1. Booking references are capped at four optimized WebP files of 192 KiB each. [README](C:/Users/mcs/Desktop/Projects/InkedByMars/README.md) · [Engineering contract](C:/Users/mcs/Desktop/Projects/InkedByMars/AGENTS.md)
- Visual references — Use the existing red-and-gold identity, wax seal, and photographs of tattoos on the body as first-party references. Study how the work follows body contours and how the flash illustrations use line and color. The studio and flash accounts are content references. Borrowing Instagram’s feed chrome or another studio’s layout, artwork, or branding is out of scope. No external design references, screenshots, or video timestamps were supplied. Studio portfolio · Mars’s flash designs
- Forbidden approaches — No fabricated portfolio work, testimonials, pricing, or availability. No implied confirmation on request submission. No generic card grids, gradient-blob hero, uniform fade-ups, decorative 3D, scroll-jacking, fake loading progress, or hover-only information. Preserve booking and admin behavior, native navigation, and existing deep links.
- Approval — Planning only until you explicitly authorize implementation. No repository files changed.

DESIGN THINKING
1. Inspect the project's actual code and dependencies; report findings and unknowns.
2. Identify three generic conventions competitors in this category tend to use; verify with actual references if browsing is available, or label assumptions.
3. Propose 2–3 substantively different defining concepts. For each, include the concept sentence, defining interaction, typographic direction with named fonts, palette, layout/composition, imagery, loader/hero/scroll language, mobile adaptation, accessibility and technical risks, difficulty, and weakest point.
4. Recommend exactly one concept with a reason related to audience, content, original brand fit, and feasibility. Do not equate novelty with usability.
5. Do not begin writing site components in this turn. Prepare docs/creative-brief.md for approval only if file creation is authorized; otherwise provide the draft inline.

NON-GENERICITY TEST
The concept must explain why this brand could not simply swap its logo and copy with a competitor. If it fails, redesign it. No default centered template hero, blobs, uniform fade-up, stock 3D, or decorative loader.

DELIVERY
Provide: verified repo facts; explicit assumptions; concept comparison and recommendation; a one-sentence governing idea; a first-screen plan; 3 motion moments with distinct purposes; the likely performance/accessibility risks; and exactly what must be approved before building. Never invent test results or design assets.
```

**Reference instruction:** For each reference, include `why`, `what to transfer` (e.g., visual hierarchy or transition continuity), `what not to transfer` (e.g., exact illustration, brand palette, or 7-second loader), and `confidence` (direct browser observation / screenshot only / third-party teardown).
