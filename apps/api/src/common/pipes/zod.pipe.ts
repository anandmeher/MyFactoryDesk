import { PipeTransform } from '@nestjs/common'
import { ZodSchema } from 'zod'

/**
 * Validates and transforms data through a Zod schema.
 * Use as: `@Body(new ZodPipe(MySchema)) dto: z.infer<typeof MySchema>`
 * Throws ZodError on failure; the global filter maps it to 400 VALIDATION_ERROR.
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    return this.schema.parse(value)
  }
}
