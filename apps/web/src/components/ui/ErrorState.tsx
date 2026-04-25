import { Button } from './Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-white p-6 text-center shadow-sm">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
