import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import puppeteer, { type Browser } from 'puppeteer'

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name)
  private browserPromise: Promise<Browser> | null = null

  async renderPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
      })
      return Buffer.from(pdf)
    } finally {
      await page.close().catch(() => undefined)
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.browserPromise) return
    try {
      const browser = await this.browserPromise
      await browser.close()
    } catch (err) {
      this.logger.warn(`Failed to close puppeteer browser: ${(err as Error).message}`)
    }
    this.browserPromise = null
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        })
        .catch((err) => {
          this.browserPromise = null
          throw err
        })
    }
    return this.browserPromise
  }
}
