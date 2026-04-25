/** XXXXXX1234 — preserve only the last 4 chars; rest masked with X. */
export function maskTail(value: string): string {
  if (value.length <= 4) return 'X'.repeat(value.length)
  const tail = value.slice(-4)
  return 'X'.repeat(value.length - 4) + tail
}
