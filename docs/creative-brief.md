# Inked by Mars creative brief

[Canva storyboard, slides 1–20](https://canva.link/nw6h91hlabfo71w) is the visual reference. The repo brief and motion records carry the implementation decisions. An exported deck is optional.

## Concept

This site is about getting a tattoo that feels like yours, expressed through Mars’s handwritten mark, studio portrait and work, so visitors understand her style and can request a session with confidence.

Audience: people considering a custom or flash tattoo in Las Piñas. Primary goal: complete an appointment request through the existing booking flow.

Use the existing wine, wax red, paper and gold tokens with Onest and Unbounded. Keep the portrait full bleed with a contrast scrim and a large lower-left headline. Use smoked glass on controls and menus. Give long copy and forms solid, readable surfaces.

## Homepage sequence

| Storyboard | Build intent |
| --- | --- |
| 1–5 | Lowercase mars is drawn over 2.5 seconds by a tattoo pen entering from the right edge. The completed mark docks inside the upper-left red wax seal when the hero is ready. Play the skippable signature on every homepage refresh, including on fast loads. Honor reduced motion. |
| 5–6 | Full-bleed portrait slides left to uncover the right-side menu, then returns on close. Overview → `/`, My Works → `/works`, Booking → `/booking`. Put both Instagram profiles below, using the URLs in `client/src/config/studio.js`. The open menu is an interaction state. |
| 7–10 | A lead photograph enters from below and recedes to reveal the surrounding mosaic. Lowercase “made to be worn” writes on in the center. Tile artwork is temporary; select production work before launch. |
| 11–13 | “Hi, I’m Mars.” Copy on the left, tattoo collage on the right. The red section slides upward like a stacked card and reveals the collage through a mask. Use existing introduction copy and verify the project collage against the storyboard. |
| 14–17 | “Where do we start?” Vertical scrolling carries each style panel horizontally over the previous one. The vertical labels accumulate on the left. Each panel holds its description and photo in place while the next panel covers it; selecting a label moves to its reading position. No booking button here. |
| 18–20 | “Your idea, in ink.” The booking section uses the same inset-to-full-width entrance as the introduction and rises as the tattoo-pen image reveals. Use one gold “Request a session” action to `/booking` and keep the short three-step process line. |

## Style copy

- **Custom** — A one-of-a-kind piece built around your idea, references, and placement.
- **Freehand** — Drawn directly on skin to follow the shape and movement of your body.
- **Minimalistic** — Fine lines and simple shapes for a small, understated piece.
- **Flash** — Choose from Mars’s ready-to-tattoo illustrations, then decide on size and placement.

## Implementation boundaries

Use the existing React routes, booking behavior and studio config. Keep mobile navigation, native scrolling and reduced-motion states functional. Treat the approved portrait, seal, signature and hand as production asset dependencies to verify or source before implementing their scene. Verify rights, crop, weight and contrast. The storyboard supplies composition and timing intent; use the motion records for implementation checks.



The homepage ends with one dark studio footer combining contact, booking, navigation and social links above an oversized INKEDBYMARS marquee.

Public navigation uses three tapered calligraphic strokes that reshape into a handwritten X. The menu is uncovered from right to left as the page moves left, with the seal and control held in place.

Booking shows the studio’s availability. Clients arrange appointments with Mars over Instagram. Studio staff record confirmed appointments and closures in the admin calendar.
