import { NextResponse } from 'next/server'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
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

  const readiness = await evaluateBrandExportReadiness(brandKitId)

  if (!readiness?.ready) {
    return NextResponse.json(
      {
        error: 'brand board export is blocked until readiness checks pass',
        issues: readiness?.issues || ['Export readiness could not be verified'],
      },
      { status: 409 },
    )
  }

  const origin = (
    process.env.PAYLOAD_PUBLIC_URL ||
    request.headers.get('origin') ||
    new URL(request.url).origin
  )
    .trim()
    .replace(/\s+/g, '')

  const format = String(body.export_format || body.format || 'pdf').toLowerCase()
  const exportPath =
    format === 'png' || format === 'pdf'
      ? `/api/export-brand-board-file?brand_kit_id=${encodeURIComponent(brandKitId)}&format=${encodeURIComponent(format)}`
      : `/brand-board/${brandKitId}`

  return NextResponse.json({
    export_url: `${origin.replace(/\/$/, '')}${exportPath}`,
    format,
  })
}
