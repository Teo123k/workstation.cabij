import chromium from '@sparticuz/chromium'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'

export const dynamic = 'force-dynamic'

const getOrigin = (request: Request) =>
  (
    process.env.PAYLOAD_PUBLIC_URL ||
    request.headers.get('origin') ||
    new URL(request.url).origin
  )
    .trim()
    .replace(/\s+/g, '')
    .replace(/\/$/, '')

const exportBrandBoard = async (request: Request, body: Record<string, unknown>) => {
  const requestUrl = new URL(request.url)
  const brandKitId = String(body.brand_kit_id || requestUrl.searchParams.get('brand_kit_id') || '').trim()
  const format = String(body.format || requestUrl.searchParams.get('format') || 'pdf').toLowerCase()

  if (!brandKitId) {
    return NextResponse.json({ error: 'brand_kit_id is required' }, { status: 400 })
  }

  if (!['pdf', 'png'].includes(format)) {
    return NextResponse.json({ error: 'format must be pdf or png' }, { status: 400 })
  }

  let browser

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1400, height: 1800 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    await page.goto(`${getOrigin(request)}/brand-board/${brandKitId}`, { waitUntil: 'networkidle0' })

    if (format === 'png') {
      const image = await page.screenshot({ fullPage: true, type: 'png' })

      return new NextResponse(image, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="Brand_Board_${brandKitId}.png"`,
          'Content-Type': 'image/png',
        },
      })
    }

    const pdf = await page.pdf({
      format: 'A4',
      margin: { bottom: '12px', left: '12px', right: '12px', top: '12px' },
      printBackground: true,
    })

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Brand_Board_${brandKitId}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ details, error: 'Failed to export brand board file' }, { status: 500 })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function GET(request: Request) {
  return exportBrandBoard(request, {})
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  return exportBrandBoard(request, body)
}
