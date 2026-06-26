import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const brandKitId = String(body.brand_kit_id || '').trim()

  if (!brandKitId) {
    return NextResponse.json({ error: 'brand_kit_id is required' }, { status: 400 })
  }

  const origin = (
    process.env.PAYLOAD_PUBLIC_URL ||
    request.headers.get('origin') ||
    new URL(request.url).origin
  ).trim().replace(/\/$/, '')

  const targetUrl = `${origin}/deliverables/${brandKitId}`

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Wait until network is idle to ensure fonts/images load
    await page.goto(targetUrl, { waitUntil: 'networkidle0' })
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    })

    // Return the PDF buffer directly
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Marketing_Deliverables_${brandKitId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
