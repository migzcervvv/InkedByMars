# Creative Web Engineering Contract

This repository uses concept-led, intent-driven design. Do not treat an attractive screenshot, a running build, or successful unit tests as proof of finished design.

## Authority and scope

- Respect the user's brief, existing architecture, business logic, constraints, and approval requirements. Inspect the repo before editing. Never commit, merge, deploy, delete data, or install large dependencies without authorization.
- This file is the short, always-on standard. The site-specific truth lives in `docs/creative-brief.md`; motion decisions live in `docs/motion-intents.yaml`; implementation and testing evidence lives in `docs/quality-report.md`. Do not fabricate these artifacts or their test results.
- If a required brief or reference is missing, supply a reasoned proposal and label it as a proposal; do not invent brand facts, visual assets, claims, or customer details.

## Creative direction before code

1. Define the site's audience, single business goal, desired feeling, available content, and constraints.
2. Offer two or three truly different governing concepts, each with a concrete visual metaphor, layout logic, motion language, accessibility/performance costs, and weakest point. Recommend one. Wait for concept approval when the user requested planning rather than implementation.
3. Before implementing, record the chosen concept in `docs/creative-brief.md` with a one-sentence concept test: 'This site is about X, expressed through Y, so visitors understand Z.'
4. All typographic, color, image, grid, transition, and interaction choices must reinforce the chosen concept. Differentiate from generic industry conventions; do not imitate a reference site's proprietary art, exact layout, or branding.

## Non-negotiable design standards

- Build a functional, useful, responsive site before adding elaborate motion. Keep semantic HTML, clear navigation, readable copy, meaningful headings, and a visible primary action.
- Define reusable tokens for fonts, spacing, colors, timing, and easing. A design token is a reusable named value that keeps decisions consistent across the site.
- Use intentional hierarchy and section pacing. Hierarchy is the visible order of importance; pacing is the alternation of density, silence, and emphasis through the page.
- Reject by default: centered headline + two buttons + gradient blob; generic card grids; repeated fade-up for every block; a single easing for every action; scroll effects without narrative or functional purpose; custom cursor that obscures native usability; decorative 3D.
- Do not add animation dependencies or large media files without a documented need and cost estimate.

## Motion intent or no motion

For every non-trivial animation record: `id`, `element`, `purpose` (orient / direct attention / create rhythm / reveal narrative / confirm interaction / mask real loading / express brand), `meaning`, `trigger`, `start_state`, `end_state`, `duration_ms` or scroll range, `easing`, `stagger_ms`, `dependencies`, `z_layers`, `removal_cost`, `mobile`, `reduced_motion`, `implementation`, `performance_risk`, `acceptance_test`.

Cut an effect if removing it loses no orientation, narrative, feedback, or distinctive brand expression. Brand expression must have an explicit, project-specific rationale; 'looks premium' is not a rationale. Never apply uniform reveal presets site-wide.

A timeline specifies the sequence and overlap of motions. Easing specifies how speed changes during an animation. Stagger specifies the offset between related animated items. Define timings deliberately; avoid arbitrary delay cascades.

## Loaders and hero

- A loader is allowed only for a real gating dependency, a justified voluntary entry interaction, or a branded narrative transition that does not delay access to usable content unnecessarily.
- Do not invent percentages or present simulated animation progress as network progress. Prefer direct rendering, a skeleton, or a useful static hero. Skip any purely branded opening on repeat visits; honor reduced motion.
- Keep the meaningful headline, navigation, and primary action readable promptly. Avoid hiding already-rendered LCP content behind an intro. LCP is the time until the largest visible content element has rendered.
- If a loader exists, reuse one visual object or spatial relationship through its handoff into the hero. Provide a skip path where the sequence can delay use.

## Scrolling and interaction

- Preserve native scrolling, browser history, deep links, text selection, and keyboard scrolling. No forced wheel interception or scroll-jacking. Scroll-jacking means overriding normal scrolling to control progression.
- Use GSAP ScrollTrigger only when a coordinated scene, scrub, or justified pin requires it. A pin holds a scene in place while the reader advances through its content. Offer a linear alternative when the pinned scene is unnecessary or inaccessible.
- Use hover for enhancement, never as the only way to reveal required information. Support touch and keyboard equivalents.
- Stop animation loops offscreen; clean up event handlers, GSAP contexts, ScrollTriggers, render loops, and observers when components unmount or routes change.

## Engineering and accessibility gates

- Keep mobile and desktop equally meaningful; adapt composition rather than merely scaling a desktop canvas. Test at approximately 375, 768, and 1440 CSS pixels, plus short desktop heights.
- Support `prefers-reduced-motion: reduce`; important content must remain available without motion. Preserve visible focus, operable controls, meaningful labels, readable contrast, logical heading order, and non-canvas fallback content.
- Aim for field LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at the 75th percentile. These are Google's good Core Web Vitals thresholds. Report local Lighthouse lab results separately; do not pretend they are field metrics.
- Proposed project guardrails until the brief supersedes them: target 60 fps on tested devices, avoid sustained frames >16.7 ms; keep critical route JavaScript and above-fold media as small as practical and report their actual sizes. Never claim a passing performance gate without measurements.
- If WebGL is chosen, document whether 2D/CSS/SVG could solve the same task, device-tier fallback, lazy loading, GPU memory/texture budgets, and what happens on context loss.

## Mandatory verification workflow

For each phase: inspect relevant existing code; state proposed changes and risks; implement only authorized work; run applicable lint/types/build/tests; start the app; capture screenshots on desktop and mobile at meaningful states; inspect keyboard, reduced motion, hover/touch, and route transitions; measure performance; compare to the brief and motion records; fix discrepancies; summarize evidence and unresolved risks.

If browser, Playwright, Lighthouse, video recording, or a reference asset is unavailable, explicitly say so and mark the corresponding quality gate UNVERIFIED. Never invent screenshots, performance results, test runs, or award expectations.

Do not proceed to the next major phase while its blocking criteria fail. When reporting work, distinguish `PASS`, `FAIL`, `UNVERIFIED`, and `WAIVED BY USER`. Preserve existing content and interactions while polishing. Document every accepted compromise.
