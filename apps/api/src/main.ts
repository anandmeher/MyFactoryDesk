import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { DataEnvelopeInterceptor } from './common/interceptors/data-envelope.interceptor'
import type { Env } from './config/env.validation'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get(ConfigService<Env, true>)

  app.setGlobalPrefix('api/v1')
  // Body/query/param validation is per-route via ZodPipe (see common/pipes/zod.pipe.ts).
  // No global ValidationPipe — keeps the dep tree class-validator-free per CLAUDE.md "Zod everywhere".
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new DataEnvelopeInterceptor())

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(',').map((s) => s.trim()),
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MyFactoryDesk API')
    .setDescription('Staff & Payroll v1 API')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = config.get('PORT', { infer: true })
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api/v1 — docs at /api/docs`)
}

void bootstrap()
