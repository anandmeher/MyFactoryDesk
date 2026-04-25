import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { ZodError } from 'zod'

type ErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const { status, body } = this.toErrorBody(exception)

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json(body)
  }

  private toErrorBody(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: exception.issues,
          },
        },
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const res = exception.getResponse()
      const { code, message, details } = this.normaliseHttpResponse(res, status)
      return { status, body: { error: { code, message, details } } }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      },
    }
  }

  private normaliseHttpResponse(
    res: string | object,
    status: number,
  ): { code: string; message: string; details?: unknown } {
    const fallbackCode = this.codeForStatus(status)

    if (typeof res === 'string') {
      return { code: fallbackCode, message: res }
    }

    const r = res as { code?: string; message?: string | string[]; error?: string; details?: unknown }
    const message = Array.isArray(r.message) ? r.message.join('; ') : r.message ?? r.error ?? 'Error'
    return {
      code: r.code ?? fallbackCode,
      message,
      details: r.details,
    }
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST'
      case 401:
        return 'UNAUTHORIZED'
      case 403:
        return 'FORBIDDEN'
      case 404:
        return 'NOT_FOUND'
      case 409:
        return 'CONFLICT'
      case 422:
        return 'UNPROCESSABLE'
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR'
    }
  }
}
