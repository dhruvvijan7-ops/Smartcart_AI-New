import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'lp-primary' | 'lp-secondary' | 'lp-onblue'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  block?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  accent: 'btn-accent',
  'lp-primary': 'btn-lp-primary',
  'lp-secondary': 'btn-lp-secondary',
  'lp-onblue': 'btn-lp-onblue',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      className={`btn ${variantClass[variant]} ${sizeClass} ${block ? 'btn-block' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}
