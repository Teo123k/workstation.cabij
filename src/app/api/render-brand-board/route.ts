import { NextResponse } from 'next/server'

import { loadBrandBoard } from '@/lib/brand/load-brand-board'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const brandKitId = String(body.brand_kit_id || '').trim()

  if (!brandKitId) {
    return NextResponse.json({ error: 'brand_kit_id is required' }, { status: 400 })
  }

  const brandBoard = await loadBrandBoard(brandKitId)

  if (!brandBoard) {
    return NextResponse.json({ error: 'brand kit not found' }, { status: 404 })
  }

  const origin =
    process.env.PAYLOAD_PUBLIC_URL ||
    request.headers.get('origin') ||
    new URL(request.url).origin

  return NextResponse.json({
    export_url: `${origin.replace(/\/$/, '')}/brand-board/${brandKitId}`,
    format: body.export_format || body.format || 'pdf',
  })
}
