export const sizeOptions = [
  ['tiny', 'Under 5 cm'], ['small', '5–10 cm'], ['medium', '10–20 cm'],
  ['large', '20–30 cm'], ['extra_large', 'Over 30 cm'], ['custom', 'Let’s discuss the size'],
]

export function createDraft(category = 'custom') {
  return { category, clientName: '', email: '', phone: '', instagramHandle: '', tattooPlacement: '', tattooSize: '', notes: '', references: [] }
}

export function validateBookingStep(draft, step) {
  const errors = {}
  const fields = step === 'idea' ? ['tattooPlacement', 'tattooSize'] : ['clientName', 'email', 'phone', 'instagramHandle']
  fields.forEach(field => { if (!draft[field]?.trim()) errors[field] = 'Please complete this field.' })
  if (step === 'details') {
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email address.'
    if (draft.clientName.trim().length > 100) errors.clientName = 'Use 100 characters or fewer.'
    if (draft.instagramHandle.trim().length > 100) errors.instagramHandle = 'Use 100 characters or fewer.'
  }
  if (draft.notes.length > 900) errors.notes = 'Use 900 characters or fewer so your full request fits.'
  return errors
}

export function buildBookingPayload(draft, preferredDate, preferredTime) {
  return {
    clientName: draft.clientName.trim(), email: draft.email.trim(), phone: draft.phone.trim(),
    instagramHandle: draft.instagramHandle.trim(), tattooPlacement: draft.tattooPlacement.trim(), tattooSize: draft.tattooSize,
    preferredDate, preferredTime,
    notes: [`Starting point: ${draft.category}`, draft.notes.trim()].filter(Boolean).join('\n'),
    referenceImages: draft.references.map(reference => ({ url: reference.dataUrl, publicId: reference.name.slice(0, 200) })),
  }
}
