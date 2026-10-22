import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  labelledBy?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    lastActive.current = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown, true)
    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not(.modal-close)',
      )
      ;(target ?? panelRef.current)?.focus()
    }, 20)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = overflow
      window.clearTimeout(t)
      lastActive.current?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || 'modal-title'}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="min-w-0">
            <h2 className="modal-title" id={labelledBy || 'modal-title'}>
              {title}
            </h2>
            {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  tone = 'danger',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  tone?: 'danger' | 'primary'
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</div>
    </Modal>
  )
}
