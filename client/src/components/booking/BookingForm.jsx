import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { workCategories } from '../../config/studio'
import { createDraft, sizeOptions, validateBookingStep } from '../../features/booking/bookingModel'
import { processImage } from '../../services/mediaUploadService'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Notice } from '../ui/Notice'

const stages = [{ id: 'idea', label: 'Your tattoo' }, { id: 'details', label: 'Your details' }, { id: 'review', label: 'Review' }]

export function BookingForm({ initialCategory, selectedDate, selectedSlot, timeAvailable, onSubmit, submitting, submitError }) {
  const formRef = useRef(null)
  const [, setParams] = useSearchParams()
  const [draft, setDraft] = useState(() => createDraft(workCategories.some(item => item.id === initialCategory) ? initialCategory : 'custom'))
  const [stage, setStage] = useState('idea')
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [timeError, setTimeError] = useState('')
  const setField = (name, value) => { setDraft(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: undefined })) }
  const focusErrors = () => requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())

  const advance = next => {
    if (submitting || processing) return
    const nextIndex = stages.findIndex(item => item.id === next)
    const currentIndex = stages.findIndex(item => item.id === stage)
    if (nextIndex <= currentIndex) { setStage(next); return }
    const ideaErrors = validateBookingStep(draft, 'idea')
    const detailsErrors = next === 'review' ? validateBookingStep(draft, 'details') : {}
    const nextErrors = { ...ideaErrors, ...detailsErrors }
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); setStage(Object.keys(ideaErrors).length ? 'idea' : 'details'); focusErrors(); return }
    if (next === 'review' && !timeAvailable) { setTimeError('Choose an available day and time in the calendar before reviewing.'); document.getElementById('availability-heading')?.scrollIntoView({ block: 'center', behavior: 'instant' }); return }
    setTimeError(''); setErrors({}); setStage(next)
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

  const submit = async event => {
    event.preventDefault()
    if (processing || submitting) return
    if (stage !== 'review') { advance(stage === 'idea' ? 'details' : 'review'); return }
    const nextErrors = { ...validateBookingStep(draft, 'idea'), ...validateBookingStep(draft, 'details') }
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); setStage('idea'); focusErrors(); return }
    if (!timeAvailable) { setTimeError('This time needs to be checked again. Choose an available time before sending.'); return }
    const result = await onSubmit(draft)
    if (result?.error?.fields && Object.keys(result.error.fields).length) {
      setErrors(result.error.fields)
      setStage(['clientName', 'email', 'phone', 'instagramHandle'].some(name => result.error.fields[name]) ? 'details' : 'idea')
      focusErrors()
    }
  }

  return <section className="booking-form-panel" data-ui aria-labelledby="booking-form-heading">
    <h2 id="booking-form-heading">Tell me your idea.</h2>
    <ol className="booking-stages">{stages.map(item => <li key={item.id}><button type="button" aria-current={stage === item.id ? 'step' : undefined} onClick={() => advance(item.id)} disabled={submitting || processing}>{item.label}</button></li>)}</ol>
    <form ref={formRef} noValidate onSubmit={submit}>
      <fieldset disabled={submitting} className="form-content" key={stage}>
        <legend className="sr-only">{stages.find(item => item.id === stage).label}</legend>
        {stage === 'idea' && <>
          <fieldset className="category-field"><legend>A starting point</legend><div className="category-controls">{workCategories.map(category => <button type="button" key={category.id} aria-pressed={draft.category === category.id} onClick={() => setField('category', category.id)}>{category.name}</button>)}</div></fieldset>
          <div className="form-columns"><Field label="Placement" name="tattooPlacement" value={draft.tattooPlacement} onChange={event => setField('tattooPlacement', event.target.value)} placeholder="Arm, shoulder, ankle…" required error={errors.tattooPlacement} /><Field as="select" label="Approximate size" name="tattooSize" value={draft.tattooSize} onChange={event => setField('tattooSize', event.target.value)} required error={errors.tattooSize}><option value="">Choose a size</option>{sizeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Field></div>
          <Field as="textarea" label="Your idea" name="notes" rows={4} maxLength={900} value={draft.notes} onChange={event => setField('notes', event.target.value)} placeholder="What would you like to carry with you?" error={errors.notes} help="Describe the subject, placement, or details that matter to you." />
          <div className="reference-field">
            <label className="upload-control">
              <Upload size={20} />
              <span>{processing ? 'Preparing your images…' : 'Add reference images'}<small id="reference-file-help">Up to four JPEG, PNG or WebP images, 20 MiB each.</small></span>
              <input type="file" name="references" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={processing || draft.references.length === 4} aria-label="Add reference images" aria-describedby="reference-file-help" />
            </label>
            <p className="field-help" role="status">{processing ? 'Compressing and uploading images.' : `${draft.references.length} of 4 images attached`}</p>
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
        {stage === 'details' && <>
          <Field label="Your name" name="clientName" autoComplete="name" maxLength={100} required value={draft.clientName} onChange={event => setField('clientName', event.target.value)} error={errors.clientName} />
          <Field label="Email" name="email" type="email" autoComplete="email" required value={draft.email} onChange={event => setField('email', event.target.value)} error={errors.email} />
          <div className="form-columns"><Field label="Phone number" name="phone" type="tel" autoComplete="tel" required value={draft.phone} onChange={event => setField('phone', event.target.value)} error={errors.phone} /><Field label="Instagram handle" name="instagramHandle" maxLength={100} placeholder="@yourhandle" required value={draft.instagramHandle} onChange={event => setField('instagramHandle', event.target.value)} error={errors.instagramHandle} /></div>
          <p className="field-help">These details let the studio follow up about your design and appointment.</p>
        </>}
        {stage === 'review' && <>
          <div className="request-review"><h3>Your request</h3><dl><div><dt>Date and time</dt><dd>{selectedDate ? formatDisplayDate(selectedDate) : 'Choose a date'}{selectedSlot && ` · ${formatDisplayTime(selectedSlot)}`}<br />Philippine time</dd></div><div><dt>Your piece</dt><dd>{workCategories.find(item => item.id === draft.category)?.name} · {draft.tattooPlacement}<br />{sizeOptions.find(([value]) => value === draft.tattooSize)?.[1]}</dd></div><div><dt>Contact</dt><dd>{draft.clientName}<br />{draft.email}<br />{draft.phone} · {draft.instagramHandle}</dd></div><div><dt>Notes and references</dt><dd>{draft.notes || 'No additional notes.'}<br />{draft.references.length} reference image(s)</dd></div></dl></div>
          <p>Submitting sends your request to Mars for review. Your appointment is confirmed separately by the studio.</p>
          <p className="field-help">Your details are used to manage this request. <button type="button" className="text-button" onClick={() => setParams(current => { const next = new URLSearchParams(current); next.set('privacy', '1'); return next }, { replace: true, preventScrollReset: true })}>Read the privacy notice</button>.</p>
        </>}
      </fieldset>
      {timeError && !timeAvailable && <Notice tone="error"><p>{timeError}</p></Notice>}
      {submitError && <Notice tone="error" title="Your request wasn’t sent."><p>{submitError.message || 'Please try again or contact Mars directly.'}</p></Notice>}
      <div className="form-actions"><Button variant="ghost" disabled={stage === 'idea' || submitting || processing} onClick={() => setStage(stage === 'review' ? 'details' : 'idea')}>Back</Button><Button type="submit" disabled={submitting || processing}>{submitting ? 'Sending your request…' : stage === 'review' ? 'Send request' : stage === 'idea' ? 'Your details' : 'Review request'}</Button></div>
    </form>
    <div className="booking-selection" aria-live="polite"><span>{selectedDate ? formatDisplayDate(selectedDate) : 'Your appointment'}</span><strong>{selectedSlot ? `${formatDisplayTime(selectedSlot)} · Philippine time` : 'Choose a day and time in the calendar'}</strong></div>
  </section>
}
