import { useId } from 'react'
export function Field({ label, error, help, as = 'input', required, ...props }) {
  const id = useId()
  const Control = as
  const description = [error ? `${id}-error` : null, help ? `${id}-help` : null].filter(Boolean).join(' ') || undefined
  return <div className="form-field"><label htmlFor={id}>{label}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label><Control {...props} id={id} className={`field-input ${props.className || ''}`} required={required} aria-invalid={error ? true : undefined} aria-describedby={description} />{help && <p className="field-help" id={`${id}-help`}>{help}</p>}{error && <p className="field-error" id={`${id}-error`}>{error}</p>}</div>
}
