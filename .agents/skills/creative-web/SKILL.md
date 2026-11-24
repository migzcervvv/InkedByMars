---
name: creative-web
description: Use for concept-led premium website design, motion art direction, front-end implementation, visual audits, browser screenshots, and intent-driven motion verification. Do not use for routine backend work, small bug fixes, or generic content changes that do not require creative direction.
---

# Creative Web Skill

Read the repository's AGENTS.md first. Inspect existing code and the project's docs/creative-brief.md and docs/motion-intents.yaml when present. Keep this skill applicable across projects; never import a fixed visual style.

When defining a new site:
1. Extract audience, offer, business outcome, available content, target devices, and constraints.
2. Review verifiable competitors and references; explicitly separate observation from inference.
3. Present 2–3 independent concepts and recommend one, noting each weakest point. Apply the 'logo-swap test': would the identity still work if you swapped the brand name? If yes, strengthen the concept.
4. Seek approval if work is planning-only. Never implement without authorization.

When implementing:
1. Follow the seven phases in PHASE_PROMPTS.md if that file exists; otherwise use concept -> static responsive design -> content -> motion spec -> hero -> scroll/transitions -> optional loader/3D -> QA.
2. Create motion records before any non-trivial animation; cut decorative effects when removal costs nothing.
3. Use existing tech stack; prefer CSS first, GSAP only for coherent timelines, ScrollTrigger when pin/scrub is needed, and WebGL only for essential dimensional meaning.
4. Preserve navigation, keyboard, native scroll, reduced motion, meaningful content, and mobile parity.
5. Start the app and visually inspect it. Use browser/Playwright/Lighthouse only when available and permitted; distinguish unavailable from passing checks.
6. Report four independent critiques: design, usability, creativity, and content. State defects and evidence, not praise or award odds.

A finished implementation report must include concept fit; motion-intent compliance; screenshots at desktop/tablet/mobile when tools are available; keyboard and reduced-motion checks; actual performance measurements where available; changes made; failures; and unverified items. Do not invent benchmark results.
