import { useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { workCategories } from '../../config/studio'
import { createDraft, sizeOptions, validateBookingStep } from '../../features/booking/bookingModel'
import { processImage } from '../../services/mediaUploadService'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Notice } from '../ui/Notice'

const stages = [
  { id: 'contact', label: 'How can I reach you?', fields: ['clientName', 'instagramHandle'] },
  { id: 'placement', label: 'Where will it go?', fields: ['tattooPlacement'] },
  { id: 'category', label: 'Choose a starting point', fields: ['category'] },
  { id: 'size', label: 'Choose an approximate size', fields: ['tattooSize'] },
  { id: 'notes', label: 'Tell me about the piece', fields: ['notes'] },
  { id: 'references', label: 'Add reference images (optional)', fields: ['referenceImages'] },
  { id: 'review', label: 'Review your request', fields: [] },
]

export function BookingForm({ initialCategory, selectedDate, selectedSlot, timeAvailable, onSubmit, submitting, submitError }) {
  const formRef = useRef(null)
  const [, setParams] = useSearchParams()
  const [draft, setDraft] = useState(() => createDraft(workCategories.some(item => item.id === initialCategory) ? initialCategory : 'custom'))
  const [stage, setStage] = useState('contact')
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [timeError, setTimeError] = useState('')
  const setField = (name, value) => { setDraft(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: undefined })) }
  const index = stages.findIndex(item => item.id === stage)
  const currentStage = stages[index]

  const pendingFocus = useRef(null)
  useLayoutEffect(() => {
    if (!pendingFocus.current) return
    const invalid = pendingFocus.current === 'error'
    pendingFocus.current = null
    const target = invalid && formRef.current?.querySelector('[aria-invalid="true"]:not(:disabled), .reference-previews button')
    const focusTarget = target || document.getElementById('booking-form-heading')
    focusTarget?.focus()
  })

  function go(next, invalid = false) {
    pendingFocus.current = invalid ? 'error' : 'heading'
    setStage(next)
  }

  function advance(event) {
    event.preventDefault()
    if (processing || submitting) return
    const allErrors = { ...validateBookingStep(draft, 'details'), ...validateBookingStep(draft, 'idea') }
    const relevant = stage === 'review' ? allErrors : Object.fromEntries(Object.entries(allErrors).filter(([key]) => currentStage.fields.includes(key)))
    setErrors(relevant)
    if (Object.keys(relevant).length) {
      go(stages.find(item => item.fields.some(key => relevant[key])).id, true)
      return
    }
    if (stage === 'review') { send(); return }
    if (stage === 'category' || stage === 'size') return
    go(stages[index + 1].id)
  }

  const upload = async event => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const remaining = 4 - draft.references.length
    if (remaining <= 0) { setUploadError('Use up to four reference images. Remove one before adding another.'); return }
    setProcessing(true); setUploadError('')
    const failures = files.length > remaining ? [`Only the first ${remaining} selected images were processed.`] : []
    try {
      for (const file of files.slice(0, remaining)) {
        try {
          const reference = await processImage(file)
          setDraft(current => ({ ...current, references: [...current.references, reference].slice(0, 4) }))
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`)
        }
      }
      setUploadError(failures.join(' '))
    } finally {
      setProcessing(false)
    }
  }

  async function send() {
    if (!timeAvailable) { setTimeError('Use Change time to choose an available session.'); return }
    const result = await onSubmit(draft)
    if (!result?.error) return
    const entries = Object.entries(result.error.fields || {})
    const mapped = Object.fromEntries(entries.map(([key, message]) => [key.replace(/^referenceImages(?:\[.*|\..*)$/, 'referenceImages'), message]))
    const invalid = stages.find(item => item.fields.some(key => mapped[key]))
    if (invalid) {
      setErrors(mapped)
      go(invalid.id, true)
    }
  }

  return <section className="booking-form-panel" data-ui aria-labelledby="booking-form-heading">
    <h2 id="booking-form-heading" tabIndex={-1}>{currentStage.label}</h2>
    <form ref={formRef} noValidate onSubmit={advance}>
      <fieldset disabled={submitting} className="form-content" key={stage}>
        <legend className="sr-only">{currentStage.label}</legend>
        {stage === 'contact' && <>
          <div className="form-columns">
            <Field label="Your name" name="clientName" autoComplete="name" maxLength={100} required value={draft.clientName} onChange={event => setField('clientName', event.target.value)} error={errors.clientName} />
            <Field label="Instagram handle" name="instagramHandle" maxLength={100} placeholder="@yourhandle" required value={draft.instagramHandle} onChange={event => setField('instagramHandle', event.target.value)} error={errors.instagramHandle} />
          </div>
        </>}
        {stage === 'placement' && <Field label="Placement" name="tattooPlacement" value={draft.tattooPlacement} onChange={event => setField('tattooPlacement', event.target.value)} placeholder="Arm, shoulder, ankle…" required error={errors.tattooPlacement} />}
        {stage === 'category' && <div className="category-controls">{workCategories.map(category => <button type="button" key={category.id} aria-pressed={draft.category === category.id} onClick={() => { setField('category', category.id); go('size') }}>{category.name}</button>)}</div>}
        {stage === 'size' && <div className="category-controls">{sizeOptions.map(([value, label]) => <button type="button" key={value} aria-pressed={draft.tattooSize === value} aria-invalid={Boolean(errors.tattooSize)} onClick={() => { setField('tattooSize', value); go('notes') }}>{label}</button>)}{errors.tattooSize && <p className="field-error">{errors.tattooSize}</p>}</div>}
        {stage === 'notes' && <Field as="textarea" label="Your idea (optional)" name="notes" rows={4} maxLength={900} value={draft.notes} onChange={event => setField('notes', event.target.value)} placeholder="What would you like to carry with you?" error={errors.notes} help="Describe the subject, placement, or details that matter to you." />}
        {stage === 'references' && <>
          <div className="reference-field">
            <label className="upload-control">
              <Upload size={20} />
              <span>{processing ? 'Preparing your images…' : 'Add reference images'}<small id="reference-file-help">Up to four JPEG, PNG or WebP images, 20 MiB each.</small></span>
              <input type="file" name="references" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={processing || draft.references.length === 4} aria-label="Add reference images" aria-invalid={Boolean(errors.referenceImages)} aria-describedby={errors.referenceImages ? "reference-error" : "reference-file-help"} />
            </label>
            <p className="field-help" role="status">{processing ? 'Compressing and uploading images.' : `${draft.references.length} of 4 images attached`}</p>
            {errors.referenceImages && <p className="field-error" id="reference-error" role="alert">{errors.referenceImages}</p>}
            {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
            {draft.references.length > 0 && <div className="reference-previews">{draft.references.map((reference, index) => (
              <figure key={`${reference.name}-${index}`}>
                <img src={reference.dataUrl} alt={`Reference: ${reference.name}`} />
                <button type="button" className="icon-button" aria-label={`Remove ${reference.name}`} onClick={() => setDraft(current => ({ ...current, references: current.references.filter((_, position) => position !== index) }))}><X size={16} /></button>
                <figcaption>{reference.name}</figcaption>
              </figure>
            ))}</div>}
          </div>
        </>}
        {stage === 'review' && <>
          <div className="request-review"><dl><div><dt>Date and time</dt><dd>{selectedDate ? formatDisplayDate(selectedDate) : 'Choose a date'}{selectedSlot && ` · ${formatDisplayTime(selectedSlot)}`}<br />Philippine time</dd></div><div><dt>Your piece</dt><dd>{workCategories.find(item => item.id === draft.category)?.name} · {draft.tattooPlacement}<br />{sizeOptions.find(([value]) => value === draft.tattooSize)?.[1]}</dd></div><div><dt>Contact</dt><dd>{draft.clientName}<br />{draft.instagramHandle}</dd></div><div><dt>Notes and references</dt><dd>{draft.notes || 'No additional notes.'}<br />{draft.references.length} reference image(s)</dd></div></dl></div>
          <p>Submitting sends your request to Mars for review. Your appointment is confirmed separately by the studio.</p>
          <p className="field-help">Your details are used to manage this request. <button type="button" className="text-button" onClick={() => setParams(current => { const next = new URLSearchParams(current); next.set('privacy', '1'); return next }, { replace: true, preventScrollReset: true })}>Read the privacy notice</button>.</p>
        </>}
      </fieldset>
      {timeError && !timeAvailable && <Notice tone="error"><p>{timeError}</p></Notice>}
      {submitError && <Notice tone="error" title="Your request wasn’t sent."><p>{submitError.message || 'Please try again or contact Mars directly.'}</p></Notice>}
      <div className="form-actions">
        {index > 0 && <Button variant="ghost" disabled={submitting || processing} onClick={() => go(stages[index - 1].id)}>Back</Button>}
        {!['category', 'size'].includes(stage) && <Button type="submit" disabled={submitting || processing}>{submitting ? 'Sending your request…' : stage === 'review' ? 'Send request' : stage === 'references' ? 'Review request' : 'Continue'}</Button>}
      </div>
    </form>
    <div className="booking-selection" aria-live="polite"><span>{selectedDate ? formatDisplayDate(selectedDate) : 'Your appointment'}</span><strong>{selectedSlot ? `${formatDisplayTime(selectedSlot)} · Philippine time` : 'Choose a day and time in the calendar'}</strong></div>
  </section>
}
