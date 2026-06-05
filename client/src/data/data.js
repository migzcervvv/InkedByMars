/* ─────────────────────────────────────────────────────────────────
   data.js — Shared constants for the About section
   Swap image URLs for real assets before shipping.
───────────────────────────────────────────────────────────────── */

export const IMG = {
  portrait: "/artist.jpg",
  studio: "/sample.jpg",
  freehand: "/freehand.jpg",
  custom: "/custom.jpg",
  minimalistic: "/minimalistic.jpg",
  flash: "/flash.jpg",
};

export const START_YEAR = 2019;

export const SPECIALIZATIONS = [
  {
    label: "Freehand",
    tag: "Signature",
    image: IMG.freehand,
    body: "Precision single-needle work with architectural detail. Thin, permanent, and deeply intentional.",
  },
  {
    label: "Custom",
    tag: "Unique",
    image: IMG.custom,
    body: "Tailored designs that reflect your individuality and story.",
  },
  {
    label: "Minimalistic",
    tag: "Narrative",
    image: IMG.minimalistic,
    body: "Classic motifs redrawn through a modern lens — saturated, sculptural, and rich with atmosphere.",
  },
  {
    label: "Flash",
    tag: "Storytelling",
    image: IMG.flash,
    body: "The body as page — complex, layered pieces built to carry entire worlds.",
  },
];

export const PROCESS = [
  {
    n: "01",
    title: "Consultation",
    body: "Every piece begins with a conversation — not about what you want, but about why you want it. No deposit yet. No rush.",
  },
  {
    n: "02",
    title: "Concept",
    body: "Reference, sketches, iteration. The design evolves until it feels inevitable rather than chosen. Custom always.",
  },
  {
    n: "03",
    title: "Execution",
    body: "Quiet studio. Deliberate needle. Each session is methodical, unhurried, and built for permanence above all else.",
  },
  {
    n: "04",
    title: "Aftercare",
    body: "The work doesn't end when you leave. Full healing guidance and a complimentary touch-up are part of every booking.",
  },
];

export const INFLUENCES = [
  {
    label: "Japanese Printmaking",
    body: "The patience of Ukiyo-e — the belief that space is as important as mark. That less pressure reveals more form.",
  },
  {
    label: "Fashion Editorial",
    body: "The tension between garment and body, between artifice and skin. The way a photograph moves the way a tattoo can't.",
  },
  {
    label: "Architecture",
    body: "Structure beneath surface. The conviction that permanence requires planning — beauty without infrastructure collapses.",
  },
];

export const CLIENT_VALUES = [
  "Private one-on-one sessions only — no walk-ins",
  "Custom designs by request — flash designs also available",
  "Full concept sketches before every appointment",
  "Aftercare guidance and complimentary touch-ups included",
  "Studio environment built for comfort, focus, and privacy",
];
