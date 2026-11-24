# Seven-Phase Prompt Sequence

Use the [creative brief](creative-brief.md), [motion records](motion-intents.yaml), and [quality report](quality-report.md) for this project. The brief links to the existing Canva storyboard.

Run these prompts in order. Do not give all phases as one giant implementation request. A gate must pass before moving forward; `UNVERIFIED` is not a pass.

## Phase 0 — Audit and concept lock

```text
Read AGENTS.md. Inspect the repository, its scripts, framework versions, existing routes, assets, brand information, and tests. Using the master project brief, propose 2–3 genuinely different concepts and recommend one. Include a first-screen composition, narrative section map, type/color suggestions, media feasibility, motion-language rules, mobile design, and risk review. Output a creative brief and explicit decisions requiring approval. No site implementation; no unrelated edits.
Gate: one clear governing concept, genuine content, realistic assets, business goal, mobile concept, and written approval.
```

## Phase 1 — Design foundations and static shell

```text
Implement ONLY the approved concept's static responsive foundation. Write design tokens for typography, colors, grid, spacing, and layering. Create semantic layout, real navigation, hero, section boundaries, usable copy and primary action. No entry loader, scrolling animation, custom cursor, WebGL, or animation library yet. Use existing dependencies where possible. Run lint/types/build. Open the app and produce desktop 1440x900, tablet 768x1024, and phone 375x812 screenshots. Report observable hierarchy and defects, not just code changes. Stop if the unanimated site does not feel distinctive and useful.
Gate: approved static composition, functional navigation, no overflow, readable headings and sufficient content, visual evidence for three sizes.
```

## Phase 2 — Content and responsive art direction

```text
Polish the approved static design without adding animation. Replace placeholders only with supplied or properly licensed assets. Strengthen typographic contrast and intentional negative space. Shape section rhythm: opening statement, explanatory section, evidence, breathing space, conversion. Create explicit mobile compositions rather than shrinking desktop. Test keyboard and screen reader structure and image alt text. Capture updated desktop/mobile screenshots and contrast checks. Preserve the Phase 1 functionality.
Gate: content has a logical narrative, CTA is discoverable, mobile and desktop compositions are independently legible, no stock-looking filler or fake claims.
```

## Phase 3 — Core motion language and hero

```text
Write docs/motion-intents.yaml for each proposed hero, navigation, hover, and scroll effect. For every motion: purpose, trigger, measurable timing, easing, start/end state, spatial layers, removal cost, reduced-motion fallback, mobile behavior, implementation cost and test. Remove any animation without a defensible purpose. Implement only the highest-value 2–4 effects; prefer CSS for feedback and GSAP timelines for linked gestures. Show a recorded or screenshot sequence with initial/middle/final states; test mouse, keyboard, touch, and reduced motion. Do not add loader yet.
Gate: purpose and visual continuity verified, readable first paint, no important information hidden, no uniform presets, performance remains within targets.
```

## Phase 4 — Scroll narrative and transitions

```text
Introduce only the approved scroll scenes and navigation transitions. Keep native scrolling, browser history, focus, deep links and text selection intact. Use ScrollTrigger for justified pinning or scrub sequences, not every section. If a pin is used, write its story beat and accessible unpinned alternative. Implement cleanup on route changes and viewport resizing. Test reverse scroll, rapid wheel/touch, short viewport, back/forward navigation, reduced motion, and the 375px phone. Capture video or a trace plus representative stills, and list any test you could not run.
Gate: orientation preserved, transitions connect actual states, no trapped scroll/focus, mobile path complete, no regressions.
```

## Phase 5 — Optional loader and advanced scenes

```text
First decide whether a loader or advanced rendering is truly necessary. List the blocking assets and how their actual readiness is measured. If no gating dependency, choose no loader. If justified, design a single loader-to-hero shared-object handoff, give a skip/repeat-visit/reduced-motion path, and avoid hiding the usable hero merely to play a sequence. If 3D/WebGL is justified, prototype it in isolation, show download and frame-cost evidence and implement a non-WebGL fallback. Do not use a simulated percentage labeled as real progress. Record the removal cost of every effect.
Gate: loader is genuinely necessary or removed, main content is available promptly, mobile fallback works, GPU and byte costs measured.
```

## Phase 6 — Independent review and quality hardening

```text
Perform a skeptical review as if this were another developer's site. Run the actual project's build/lint/type/tests and inspect in a browser at 1440x900, 768x1024, 375x812, and 320px wide. Use Playwright for screenshots and interactions where available; use Lighthouse for lab audits, browser Performance panel/traces for long frames, accessibility checks and keyboard-only navigation. Run prefers-reduced-motion emulation and test all major interactions. Compare against docs/creative-brief.md and docs/motion-intents.yaml. Report the four Awwwards dimensions separately: design, usability, creativity, and content. Produce docs/quality-report.md with PASS / FAIL / UNVERIFIED / WAIVED statuses, measured assets, concrete defects with severity, fixes made, before/after evidence, and residual risks. Fix blocking defects only; do not redesign an approved concept silently. Do not claim field Core Web Vitals from Lighthouse lab numbers or claim an award likelihood.
Gate: zero blocking accessibility/functional failures, all intended motions documented, acceptable measured performance or an explicitly accepted tradeoff, and visual sign-off.
```

## Review command between phases

```text
Critique the current phase against the governing idea and its gate. Identify the weakest decision first. Separate visual failures, narrative failures, accessibility/performance failures, and unverified claims. Recommend the smallest high-impact corrections. Do not implement corrections until I approve, unless changes for this phase are explicitly delegated.
```
