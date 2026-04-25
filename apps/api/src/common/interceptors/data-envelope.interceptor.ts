import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common'
import { Observable, map } from 'rxjs'

/**
 * Wraps successful responses in `{ data: T }`.
 * Skips wrapping when the handler already returned `{ data, meta }` (paginated lists)
 * or when the response is a stream (PDF endpoints).
 */
@Injectable()
export class DataEnvelopeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value === undefined || value === null) {
          return { data: null }
        }
        if (value instanceof StreamableFile || Buffer.isBuffer(value)) {
          return value
        }
        if (typeof value === 'object' && value !== null && 'data' in (value as object)) {
          return value
        }
        return { data: value }
      }),
    )
  }
}
