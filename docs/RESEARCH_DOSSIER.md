# Codex Creative Web System — Research Dossier

**Date:** 19 November 2026. **Evidence labels:** `VERIFIED` = current official documentation or explicitly attributed inspected-site teardown; `INFERENCE` = design judgment inferred from evidence; `PROPOSAL` = recommended process or threshold, not established outcome.

## Main conclusion

The reusable solution is an operating system, not a universal aesthetic prompt: short persistent project policy; a project-specific governing concept; a motion-intent record for each meaningful animated element; approved build phases; and a visual+functional verification loop. Awwwards recognition cannot be forced by text instructions, and some award winners fail basic accessibility checks.

## Codex: current state (VERIFIED)

- Codex CLI 0.170.0 released 2026-11-18. GPT-6.2 Astra and Sol became available on supported Codex plans on 2026-11-17. Astra is a reasonable choice for concept adjudication and difficult visual diagnosis; Sol is suited to routine development. Models in Codex: `gpt-6.2-astra`, `gpt-6.2-sol` on supported clients. Availability is plan/client-dependent.
- Available surfaces include the ChatGPT desktop Codex experience, CLI, IDE extension and Codex Cloud. The desktop built-in browser can open localhost, inspect rendered state and capture screenshots. Cloud browser access is conditional; built-in desktop browser is NOT built into CLI/IDE, although Playwright/Chromium can be installed and run from an allowed terminal.
- `AGENTS.md` is discovered in the project tree, with `AGENTS.override.md` overriding the same directory; `project_doc_max_bytes` defaults to 32 KiB aggregate. Higher-priority instructions and permission policy still apply. User config is `~/.codex/config.toml`; trusted repo config `.codex/config.toml`; CLI flags can override settings.
- Skills are reusable `SKILL.md` files discovered in `.agents/skills` from CWD toward repository root, or `~/.agents/skills`. Invocation `$creative-web` or `/skills`; skill descriptions are loaded first to save context. Initial skill-list budget 2% of context or 8000 characters if unknown; full SKILL.md loads when selected.
- Image input is supported (`codex -i screenshot.png "..."` according to Codex image-input docs). Use screenshots PLUS written constraints and multiple states. The browser/Playwright/Lighthouse capability depends on permissions, setup and environment.

## Why generic results happen (MIXED)

OpenAI's frontend guidance identifies vague directions as a common cause of familiar layout and weak differentiation (VERIFIED: official guidance). The following are expert-observed failure modes, not a statistically measured taxonomy (INFERENCE): interchangeable centered heroes; maximal type without hierarchy; arbitrary font pairings; color effects masquerading as brand strategy; card grids regardless of content; uniform whitespace, rhythm and fade-up; unrelated 3D; missing content; no revision from browser screenshots. Corrective practices (PROPOSAL): require a project-specific concept and logo-swap test; reject a concept without a distinct asset/content strategy; approve static design before motion; document animation purposes; compare multi-viewport screenshots; use targeted user feedback and test evidence.

## Motion taxonomy (PROPOSAL)

1. **Orient** — keeps users aware of place/state; e.g., a card expands into its detail page.
2. **Direct attention** — points to new or important content; e.g., selected state shifts, not everything animating.
3. **Create rhythm** — times information reveal to reading or repeated actions without obstructing it.
4. **Reveal narrative** — visually demonstrates a proposition; e.g., architecture sketch becomes a building.
5. **Confirm interaction** — immediate response to input; e.g., saved state, button press.
6. **Mask real loading** — visually acknowledges a genuine wait, with honest readiness messaging.
7. **Express brand** — behaves according to the brand's specific material or metaphor, with documented rationale.

Removal test: if the static design retains orientation, narrative comprehension, interaction feedback and specific brand character, CUT the motion. A mere 'feels premium' claim does not pass.

## Motion technique decisions (PROPOSAL)

- **Loader:** default none. Show only while blocking assets decode or when opting into an explicitly interactive narrative. Do not fake 0–100%. Avoid second hero intro after loader; the same visual object should transform into final hero. Skip brand theater on repeat visits, respect reduced motion, never hide usable content to inflate perceived drama.
- **Hero:** prioritize static identity and readable content; add one distinctive transformation if it communicates the actual proposition. Use CSS transforms/masks + GSAP timeline; minimize heavyweight shaders. Keep essential copy in DOM and visible promptly; don't defer LCP to stage a cinematic moment.
- **Scroll:** use CSS view timelines for localized effects; GSAP ScrollTrigger for multi-part sequences and deliberate pins; evaluate Lenis separately; never force wheel interception. Use 3D only when understanding the shape, movement, or components of an object is essential.
- **Pinning:** permitted when needed to connect multiple states of the same meaningful subject. A tall pinned 40-screen story is not automatically better than a 6-screen linear one. Provide no-pin/mobile/reduced-motion paths.
- **Scrubbing:** animation progress tied to scroll position; useful for reversible explanation; avoid for body text visibility.
- **Parallax:** layers move at different rates; use only where depth tells a spatial story, never on every background.
- **Horizontal sections:** use when a horizontal timeline or side-by-side comparison is intrinsic to the information, not to make ordinary cards look unusual.
- **View Transitions API:** progressive enhancement; if unsupported or problematic, instant route navigation with preserved focus and browser history.
- **WebGL/shaders:** a GPU-rendered scene / small graphics program for special materials or 3D; require fallback, lazy loading, device-tier quality, and real testing.

## Timing and layering (PROPOSAL)

CSS named values as starting points: feedback 120ms, hover 220ms, panel 420ms, navigation 700ms, hero statement 1050ms. Eases: entrance `cubic-bezier(.16,1,.3,1)`, emphasis `cubic-bezier(.76,0,.24,1)`, settle `cubic-bezier(.22,1,.36,1)`; stagger 35–80ms. `z` plan: base artwork 0, in-scene layers 1–3, headline 4, navigation/CTA 10, dismissible overlays 20, dialog 100. These are design proposals, not validated universal standards. Differentiate physical/material behavior; do not apply all values blindly.

## Awards teardown — verified site descriptions via published technical teardowns

The table spans 2025-11-19 through 2026-11-19 by qualifying award recognition; Lando Norris's 2025-11-17 SOTD is two days earlier, but its November 2025 FWA and 2025 Site of the Year distinction qualify. The original Awwwards listings are linked from each teardown. Where the original sites could not be reliably inspected live in this research environment, descriptions are attributed to the independent, hands-on technical teardowns by Rick Creates and sometimes an agency-authored Codrops making-of. These are not independent browser traces executed by this researcher.

| Site / award | Governing concept | Loader -> hero | Scroll and transitions | Type and technique | Learn / do not copy |
|---|---|---|---|---|---|
| **Lando Norris** — Awwwards 2025 SOTY; FWA FOTD Nov 20 2025 | Driver's helmet/livery as identity; speed and private/public duality | Neon contour LN loader becomes an eye/portrait reveal (~2.5s to portrait) | Fluid helmet-inspired effects, flowing track geometry, scroll-linked text and imagery, route panels | **Brier + Mona Sans**; Webflow, three.js, GSAP, Lenis, Rive, MSDF font atlases | Learn to derive motion from real brand material. Do NOT copy the GPU budget or disregard of reduced motion. |
| **MindMarket** — Awwwards Dec 2025 SOTM | One continuous thread connects qualitative research, people and business | Green line logo draws (~1s); beige curtain lifts (~1s); illustrations rise | Scroll-drawn giant ribbon ties four business pillars, then hands off to real evidence/CTA | **Inter** only, made expressive by scale; Astro, GSAP, Rive, Swup, Locomotive Scroll | Learn one visual motif across entire IA and mobile-redrawn paths. Do NOT replicate missing reduced-motion support or heavy secondary-page Rive asset. |
| **Sleep Well Creative** — Jan 2026 Awwwards SOTD; Feb FWA FOTD | Educational chapters as two-ink 3D illustrated picture book | Crescent logo on cream loading panel and Enter Site gate; ink-like expansion into dunes, very long title settlement | Seven chapters with alternating backgrounds and 3D vignettes; scroll reveals lessons, hidden insights | **PP Editorial New + Neue Montreal**; Webflow, three.js, GSAP, ScrollTrigger, Lenis, shaders | Learn to let scenes visualize each claim. Do NOT copy 44+ MB download, prolonged entry, or poor keyboard/reduced-motion behavior. |
| **Maxima Therapy** — Apr 2026 SOTD | Life stages viewed through a rotating illustrated wheel and changing angle | 5s bouncing words; ANGLE tips; V split opens into illustrated wheel | Wheel turns 90° to programs; papers peel on scroll; colors follow stages | **Robuck Rounded + ABC Diatype Rounded Plus**; React Router, GSAP, Lenis, Matter.js, Lottie | Learn use of one physical motion rule and color-coded sections. Do NOT force the 5s opening on every visit or unmanageable keyboard menus. |
| **The Watch** — Aug 2026 SOTD / Jun FWA | Watchmaking understood by rotating and exploding a single physical object | Small circular loader; camera recedes into watch hero; first scene usable ~5.5s | Continuous 3D camera and part transitions over ~40 scroll screens; color choices alter materials | **Nekst + Inter**; Svelte, three.js, GSAP, Lenis, glTF+EXR | Learn real object as navigation/explanation. Do NOT copy ~11.7MB opening downloads, canvas-only interactions or long scroll as a default. |
| **illoca / Tracing Paper** — Sep 2026 SOTD / Aug FWA | Architecture tracing paper, desk, and the act of sketch -> built form | Grid-paper hero with 3D window; intro settles into architect's desk (full first-screen ~4.5–5s); detailed standalone loading choreography not confirmed | Five features demonstrated as one continuous desk camera journey; sketch -> plan -> 3D building; demos available separately | **F37 Analog + Graphik + Geist Mono + Architect Pro**; Nuxt, three.js, Theatre.js, GSAP, Lenis | Learn real product workflow as narrative and editorial overlays. Do NOT copy a 40-screen scroll or 8.4 MB download unless need and device testing justify it. |
| **Why Zero** — Sep 2026 SOTM / Jul FWA FOTM | University critique staged as countdown to zero and five interactive acts | Real-looking countdown precedes mandatory draw-a-zero gate (~4.5s readiness) | Held buttons cause major act changes; custom virtual scroll, 3D immersive scenes, adaptive rendering | **Bethany Elingston + STK Bureau Serif + PP Supply Mono**, plus utility faces; Vite, three.js, GSAP, Howler | Learn high-stakes narrative structure and actual input participation. Do NOT copy scroll-jacking, non-semantic canvas captions, or inaccessible gating. |
| **Gil Huybrecht** — Sep 2026 SOTD / Aug FWA | Portfolio as a wall of print proofs; same artwork moves between states | Loading percentage -> 0.6s cover fade -> 1.3s grid-cell rise, 75ms stagger | Click sends a cluster of work images into project-detail positions; grid/gallery transitions preserve spatial orientation | **Lay Grotesk** only; Nuxt, three.js, GSAP, Lenis; non-WebGL fallback on mobile | Learn shared-object continuity and strong editorial grid. Do NOT copy 46 MB preload or keyboard-inaccessible project grid. |
| **Jesper Landberg** — Sep 2026 SOTD / Aug FWA | Projects on a curved 3D ribbon in a black exhibition space | Brief loader -> project ribbon moves into view; exact intro timing not separately verified | Wheel velocity shifts ribbon, project cards become pages, profile warps space into black-hole lens | **ABC Diatype Plus**; Nuxt, three.js, GSAP, texture compression | Learn object continuity across route changes and removing distracting background effects. Do NOT copy ~34.6MB media or ignore focus/reduced-motion. |
| **Heron AI** — Oct 2026 SOTD; Sep CSSDA WOTD | Building plan / technical drawing with AI represented as an active correction tool | Drafting elevation strokes + orange boot/status bar -> horizontal pencil-shading window reveals SAME elevation and interactive headline | Drag to identify violations; pinned floor plan assembles; hand-drawn SVG reveal; page routes shrink as drafting windows | **BT Grotesk + Geist Mono**; Webflow, Vite, GSAP/ScrollTrigger, Lenis, Barba, SVG masks and DOM coordinates | Learn to prefer 2D math over unnecessary WebGL and make hero actually demonstrate product. Do NOT copy ~8s forced loader, mouse-only interaction or fake-product claims. **Heron is a fictional portfolio exercise, not an existing product.** |

**Important verification limits:** When independent notes omit exact loader dynamics or specify no exact animation library for a particular gesture, the table does not assert more. Recorded device-specific metrics are case-study observations, not independently reproduced lab results. Some sites have changed since the awards. Review live before reusing inspiration in a production project.

## Cross-site pattern synthesis

**INFERENCE: saturating motifs:** smooth-scrolling for its own sake, full-viewport intro curtains, typography that merely scales to the whole screen, 3D canvases with trailing custom cursors, 5–40-screen pinned chapters, scroll-driven letter reveals. These motifs appear repeatedly across the sampled award sites, but this sample is selection-biased, not an exhaustive census of design trends.

**INFERENCE: durable principles:** a brand-specific metaphor, shared-element continuity from loader to hero or card to detail, typography as information structure, alternating narrative and quiet editorial sections, media that proves an idea, responsive redirection rather than uniform scaling, and motion with an explicit removal cost. A site's recognizable identity should survive in a screenshot, while interaction should enhance understanding rather than substitute for it.

## Verification and budgets

**VERIFIED GOOGLE FIELD METRICS:** Core Web Vitals at p75: LCP <= 2.5 seconds; INP <= 200 milliseconds; CLS <= 0.1. Lab Lighthouse scores are not p75 field data. **PROPOSED INTERNAL GATES:** aim 60fps (16.7ms/frame) for substantive interactions in the devices tested; project-specific JS/image/3D budgets documented before library selection; optional 200KB gzip additional animation JS ceiling for a lightweight marketing site, adjustable after measuring. Never pretend this is a universal standard.

**Accessibility:** Use WCAG 2.2 AA targets for actual text contrast (normal 4.5:1 and large 3:1, with documented exceptions), visible keyboard focus, meaningful DOM text and labels, usable skip navigation, no essential mouse-only behavior, and `prefers-reduced-motion` best practice across animated scenes. Test without motion and without canvas. For scroll scenes, test wheel, touch, keyboard, rapid reversals, resize, back button, and screens with short viewport heights. Respect platform pointer and contrast preferences.

**Evidence protocol:** use Playwright screenshots at 1440x900, 768x1024, 375x812, and 320 wide; record initial, mid-animation, final and reduced-motion states. Include browser console errors, Lighthouse JSON if available, Performance traces for long frames, and real-test logs. Mark any unavailable tool `UNVERIFIED`. Use screenshots for aesthetic critiques, automated assertions for functional gates; neither replaces human judgment.

## Source index — title and URL

**OpenAI/technical primary documentation**
1. OpenAI, *ChatGPT & Codex changelog*, https://learn.chatgpt.com/docs/changelog
2. OpenAI, *Models*, https://learn.chatgpt.com/docs/models
3. OpenAI, *Custom instructions with AGENTS.md*, https://learn.chatgpt.com/docs/agent-configuration/agents-md
4. OpenAI, *Build skills*, https://learn.chatgpt.com/docs/build-skills
5. OpenAI, *Browser*, https://learn.chatgpt.com/docs/browser
6. OpenAI, *Image inputs*, https://learn.chatgpt.com/docs/image-inputs
7. OpenAI, *Designing delightful frontends with GPT-5.4*, https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
8. OpenAI, *Rethinking skills and prompts for GPT-6 Astra*, https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
9. GSAP official GitHub, https://github.com/greensock/GSAP ; ScrollTrigger reference, https://gsap.com/docs/v3/Plugins/ScrollTrigger/
10. Lenis GitHub releases, https://github.com/darkroomengineering/lenis/releases
11. Three.js GitHub releases, https://github.com/mrdoob/three.js/releases
12. Web Platform DX, *Scroll-driven animations*, https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/
13. Web Platform DX, *Cross-document View Transitions*, https://web-platform-dx.github.io/web-features-explorer/features/cross-document-view-transitions/
14. MDN, *Document.startViewTransition()*, https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition
15. Google, *Web Vitals*, https://web.dev/articles/vitals
16. W3C, *WCAG 2.2 quick reference*, https://www.w3.org/WAI/WCAG22/quickref/
17. Playwright, *Test Use Options*, https://playwright.dev/docs/test-use-options
18. Codrops / Bearplus, *Inside Heron: Designing an AI Agent Without Designing 'AI'*, https://tympanus.net/codrops/2026/10/12/heron-ai/

**Award cases and independent technical teardowns (with links to award listings within each article)**
19. *Lando Norris*, https://rickcreates.com/r/2025-11-20-lando-norris — live https://landonorris.com/
20. *MindMarket*, https://rickcreates.com/r/2025-12-29-mindmarket — live https://mindmarket.com/
21. *Sleep Well Creative*, https://rickcreates.com/r/2026-02-07-sleep-well-creative — live https://sleep-well-creatives.com/
22. *Maxima Therapy*, https://rickcreates.com/r/2026-04-07-maxima-therapy — live https://maximatherapy.com/
23. *The Watch*, https://rickcreates.com/r/2026-08-17-the-watch — live https://thewatch.60fps.fr/
24. *illoca*, https://rickcreates.com/r/2026-09-04-illoca — live https://illoca.unseen.co/
25. *Why Zero*, https://rickcreates.com/r/2026-09-07-why-zero — live https://why.zero.university/
26. *Gil Huybrecht*, https://rickcreates.com/r/2026-09-21-gil-huybrecht — live https://gilhuybrecht.com/
27. *Jesper Landberg*, https://rickcreates.com/r/2026-09-29-jesper-landberg — live https://jesperlandberg.com/
28. *Heron AI*, https://rickcreates.com/r/2026-10-12-heron-ai — live https://heronaiapp.com/
