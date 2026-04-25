import { isAxiosError } from 'axios'

/** Extract a human-readable message from any error our API returns. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string; code?: string } }
      | undefined
    return data?.error?.message ?? err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
