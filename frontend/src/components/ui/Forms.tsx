import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react'

interface CommonProps {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  required?: boolean
  requiredLabel?: string
}

export function FormField({
  label,
  hint,
  error,
  required,
  requiredLabel = 'required',
  children,
  className = '',
}: CommonProps & { children: (props: { id: string; 'aria-describedby': string; 'aria-invalid': boolean }) => ReactNode; className?: string }) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : ''
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="req" aria-label={requiredLabel}>
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
      {hint && !error ? (
        <div className="field-hint" id={`${id}-hint`}>
          {hint}
        </div>
      ) : null}
      {error ? (
        <div className="field-error" id={`${id}-err`} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export function TextInput({
  label,
  hint,
  error,
  required,
  icon,
  className,
  ...rest
}: CommonProps & InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} className={className}>
      {(p) =>
        icon ? (
          <span className="input-wrap">
            <span className="input-icon" aria-hidden="true">
              {icon}
            </span>
            <input className="input" id={p.id} aria-describedby={p['aria-describedby']} aria-invalid={p['aria-invalid']} required={required} {...rest} />
          </span>
        ) : (
          <input className="input" id={p.id} aria-describedby={p['aria-describedby']} aria-invalid={p['aria-invalid']} required={required} {...rest} />
        )
      }
    </FormField>
  )
}

export function PasswordField({
  label = 'Password',
  hint,
  error,
  required,
  ...rest
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(p) => (
        <span className="input-wrap">
          <input
            className="input"
            id={p.id}
            aria-describedby={p['aria-describedby']}
            aria-invalid={p['aria-invalid']}
            type={visible ? 'text' : 'password'}
            required={required}
            {...rest}
          />
          <button
            type="button"
            className="input-affix"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            style={{ right: 8 }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      )}
    </FormField>
  )
}

export function SelectField({
  label,
  hint,
  error,
  required,
  options,
  className,
  ...rest
}: CommonProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[]
    className?: string
  }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} className={className}>
      {(p) => (
        <select className="select" id={p.id} aria-describedby={p['aria-describedby']} aria-invalid={p['aria-invalid']} required={required} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} className={className}>
      {(p) => (
        <textarea className="textarea" id={p.id} aria-describedby={p['aria-describedby']} aria-invalid={p['aria-invalid']} required={required} {...rest} />
      )}
    </FormField>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className = '',
  width,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  className?: string
  width?: string | number
}) {
  return (
    <div className={`topbar-search ${className}`} style={{ width: width ?? 'min(280px, 100%)' }}>
      <span className="input-icon" aria-hidden="true">
        <Search size={15} />
      </span>
      <label className="sr-only" htmlFor="search-input">
        {label}
      </label>
      <input
        id="search-input"
        type="search"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
