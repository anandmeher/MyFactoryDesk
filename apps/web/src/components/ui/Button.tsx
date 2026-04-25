import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'tap'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-slate-700',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
}

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-sm rounded',
  tap: 'min-h-tap px-4 py-3 text-base rounded font-medium',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  ),
)
Button.displayName = 'Button'
