import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
export function Dialog({ open, onClose, title, children, className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return undefined
    const previousFocus = document.activeElement
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus() }
  }, [open])
  return createPortal(<dialog ref={ref} className={`studio-dialog ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === ref.current) onClose() }}><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><X size={20} /></button></div>{open && children}</dialog>, document.body)
}
