import { NextResponse } from 'next/server'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
import { loadMarketingDeliverables } from '@/lib/brand/load-marketing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const brandKitId = String(body.brand_kit_id || '').trim()

  if (!brandKitId) {
    return NextResponse.json({ error: 'brand_kit_id is required' }, { status: 400 })
  }

  const deliverables = await loadMarketingDeliverables(brandKitId)

  if (!deliverables) {
    return NextResponse.json({ error: 'brand kit not found' }, { status: 404 })
  }

  const readiness = await evaluateBrandExportReadiness(brandKitId, { requireMarketingStrategy: true })

  if (!readiness?.ready) {
    return NextResponse.json(
      {
        error: 'marketing deliverables export is blocked until readiness checks pass',
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

  return NextResponse.json({
    export_url: `${origin.replace(/\/$/, '')}/api/export-deliverables-pdf?brand_kit_id=${encodeURIComponent(brandKitId)}`,
    format: 'pdf',
  })
}
