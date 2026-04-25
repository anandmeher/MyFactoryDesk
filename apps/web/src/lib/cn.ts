import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with shadcn-style conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
