# Creative Web Review Rubric

**Scoring is a proposed internal method, NOT an official Awwwards formula.** Evaluate 0–5 in each subcategory, then multiply the average by the category's allotted weight. Final score is /100. Any hard rejection blocks approval regardless of score.

| Category | Weight | What reviewers must examine |
|---|---:|---|
| Concept / differentiation | 15 | Single governing idea, brand-specific metaphor, avoids logo-swap look |
| Visual hierarchy / typography | 15 | Appropriate typeface selection, dominant focal point, text readability, whitespace, considered spacing |
| Composition / image direction | 10 | Distinctive layouts, coherent palette, intentional imagery, consistency across sections |
| Narrative / content | 15 | Accurate copy, section pacing, proofs of claims, clear business objective, meaningful CTA |
| Motion intent / craftsmanship | 15 | Record for every non-trivial effect; distinct triggers/timings; clear sequence and continuity; motion removal cost |
| Usability / accessibility | 15 | Keyboard, focus, contrast, touch, reduced motion, native scroll, semantic text, assistive technology |
| Performance / responsive robustness | 10 | LCP/INP/CLS, lab metrics separately, asset bytes, FPS/frame time, desktop/tablet/phone/short viewport |
| Verification / maintainability | 5 | Reproducible commands, screenshots and trace evidence, clean lifecycle, minimal unnecessary dependencies |

Scoring guidance: 0 absent/broken, 1 serious deficiency, 2 generic/partially functional, 3 competent, 4 strong and cohesive, 5 distinctive and verifiably excellent.

**Pass rule (project policy)**: >=85/100 overall, >=4/5 concept, >=4/5 motion intent, >=4/5 usability, and no blockers. 75–84 is revision, <75 rework core direction. The numerical thresholds are proposed local design gates, not award benchmarks.

## Hard rejection criteria

1. No governing concept or concept fails the brand logo-swap test.
2. Static design depends on animation to become understandable.
3. A default centered template hero, miscellaneous gradient blobs, or repeated uniform fade-up used without a project-specific, documented rationale.
4. Loader blocks already usable content; repeats on every visit unnecessarily; fakes download progress.
5. Key action unusable via keyboard or touch, missing focus, or motion cannot be reduced.
6. Scroll lock/forced wheel progress, broken browser back/forward, inaccessible pinned content, or required content embedded only in canvas.
7. Mobile is only a clipped or uniformly scaled desktop layout.
8. No screenshot-based review when browser access was available; fake claims about tests or metrics.
9. Claims, testimonials, partner logos, photos or products fabricated without source authorization.
10. Performance budgets or existing project requirements violated with no documented approval.

## Anti-pattern -> stronger replacement

| Anti-pattern | Why it fails | More purposeful replacement |
|---|---|---|
| Centered slogan + two buttons + blob | Familiar interchangeable entry | Brand-specific editorial asymmetry or an object-led layout illustrating the proposition |
| Every section fades upward | Zero information hierarchy; monotonous pacing | Let ordinary content stay static; animate only narrative transformations and feedback |
| Every motion uses 0.6s ease-out | All actions receive equal emphasis | 120ms confirmations; 220ms hover; 420ms panel; 700ms navigation; 1050ms one-off hero, adjusted to content |
| A fake 0–100% loader | Misleads and delays | Render immediately or show real readiness with honest, nonnumeric state |
| Disconnected loader and hero | Gratuitous double introduction | One object changes state from loader to hero, with no second reveal |
| Multi-second intro on each visit | Frustrates return users | On first visit only if justified; skip/reduced-motion path; no blocking when assets ready |
| Generic parallax on all imagery | No narrative meaning; common cliché | One depth relationship that reveals an otherwise hidden connection |
| Arbitrary pinned 8-screen scene | Traps attention and increases page length | One justified story beat with time to read; short or linear fallback |
| Horizontal scroll for content cards | Hides information and impairs navigation | Horizontal motion only for truly sequential comparison; otherwise normal vertical list |
| Smooth-scroll engine by default | Adds complexity and input lag | Native scroll with sparse ScrollTrigger or CSS scroll timelines |
| Custom cursor as sole label | Breaks touch, focus and discoverability | Visible semantic labels; cursor treatment only as progressive enhancement |
| Stock 3D sphere/shader | Heavy visual garnish; brand interchangeable | Photograph, SVG, or genuine product model driven by user intent |
| Desktop WebGL reused unmodified on mobile | GPU/thermal/download risk | Separate mobile composition or static image/video fallback |
| Canvas-only copy | Screen readers cannot read it | DOM text layered over visuals with equivalent semantic content |
| Unverified visually attractive code | Syntax success != design success | Responsive screenshots, short video/trace, tests and explicit issue log |
