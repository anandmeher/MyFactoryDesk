import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, invalid, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-300',
        invalid ? 'border-red-400' : 'border-slate-300',
        className,
      )}
      {...rest}
    />
  ),
)
Input.displayName = 'Input'
