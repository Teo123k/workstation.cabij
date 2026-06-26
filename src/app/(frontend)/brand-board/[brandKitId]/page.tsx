import { notFound } from 'next/navigation'
import React from 'react'

import { BrandBoard } from '@/lib/render/brand-board'
import { loadBrandBoard, type LoadedBrandBoard } from '@/lib/brand/load-brand-board'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    brandKitId: string
  }>
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const toBoardKit = (kit: LoadedBrandBoard) => {
  const fullKit = asRecord(kit.full_brand_kit_json)

  return {
    direction_name: kit.direction_name,
    colors_json: asArray(kit.colors_json || fullKit.colors_json) as {
      name: string
      hex: string
      usage: string
    }[],
    typography_json: asRecord(kit.typography_json || fullKit.typography_json) as {
      heading_font: string
      heading_weight: string
      body_font: string
      body_weight: string
      accent_font?: string | null
      rationale: string
    },
    logo_direction: kit.logo_direction || String(fullKit.logo_direction || ''),
    photography_style: kit.photography_style || String(fullKit.photography_style || ''),
    social_media_vibe: kit.social_media_vibe || String(fullKit.social_media_vibe || ''),
    instagram_grid_style: kit.instagram_grid_style || String(fullKit.instagram_grid_style || ''),
    ad_content_style: kit.ad_content_style || String(fullKit.ad_content_style || ''),
    content_rules_json: asRecord(kit.content_rules_json || fullKit.content_rules_json) as {
      do_rules: string[]
      dont_rules: string[]
    },
  }
}

export default async function BrandBoardPage({ params }: PageProps) {
  const { brandKitId } = await params
  const kit = await loadBrandBoard(brandKitId)

  if (!kit) {
    notFound()
  }

  const clientName = kit.client_name || 'Brand Client'

  return (
    <div style={{ background: '#f4f1eb', minHeight: '100vh', padding: '32px 16px' }}>
      <BrandBoard clientName={clientName} brandKit={toBoardKit(kit)} />
    </div>
  )
}
