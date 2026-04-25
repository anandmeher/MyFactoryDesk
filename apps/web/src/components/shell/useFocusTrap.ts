import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Lightweight focus trap for the slide-out drawer.
 * - When `active` becomes true: pushes focus to the first focusable element inside the ref.
 * - Esc key triggers `onEscape`.
 * - Tab cycles inside the container.
 * - When `active` becomes false: restores focus to the previously focused element.
 *
 * Intentionally no third-party dep — see design.md §D2.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onEscape: () => void,
): void {
  useEffect(() => {
    if (!active || !ref.current) return

    const container = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    function getFocusable(): HTMLElement[] {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )
    }

    const focusable = getFocusable()
    focusable[0]?.focus()

    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      const activeEl = document.activeElement as HTMLElement | null

      if (e.shiftKey && activeEl === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKey)
    return () => {
      container.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [active, onEscape, ref])
}
