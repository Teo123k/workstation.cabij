import { notFound } from 'next/navigation'
import React from 'react'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
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
  const typography = asRecord(kit.typography_json || fullKit.typography_json)
  const rules = asRecord(kit.content_rules_json || fullKit.content_rules_json)

  return {
    direction_name: kit.direction_name,
    colors_json: asArray(kit.colors_json || fullKit.colors_json).map((color) => {
      const row = asRecord(color)

      return {
        name: String(row.name || 'Brand color'),
        hex: String(row.hex || '#111111'),
        usage: String(row.usage || ''),
      }
    }),
    typography_json: {
      heading_font: String(typography.heading_font || 'Inter'),
      heading_weight: String(typography.heading_weight || '700'),
      body_font: String(typography.body_font || 'Inter'),
      body_weight: String(typography.body_weight || '400'),
      accent_font: typography.accent_font ? String(typography.accent_font) : null,
      rationale: String(typography.rationale || ''),
    },
    logo_direction: kit.logo_direction || String(fullKit.logo_direction || ''),
    photography_style: kit.photography_style || String(fullKit.photography_style || ''),
    social_media_vibe: kit.social_media_vibe || String(fullKit.social_media_vibe || ''),
    instagram_grid_style: kit.instagram_grid_style || String(fullKit.instagram_grid_style || ''),
    ad_content_style: kit.ad_content_style || String(fullKit.ad_content_style || ''),
    content_rules_json: {
      do_rules: asArray(rules.do_rules).map(String),
      dont_rules: asArray(rules.dont_rules).map(String),
    },
  }
}

export default async function BrandBoardPage({ params }: PageProps) {
  const { brandKitId } = await params
  const [kit, readiness] = await Promise.all([
    loadBrandBoard(brandKitId),
    evaluateBrandExportReadiness(brandKitId),
  ])

  if (!kit) {
    notFound()
  }

  const clientName = kit.client_name || 'Brand Client'

  return (
    <div style={{ background: '#f4f1eb', minHeight: '100vh', padding: '32px 16px' }}>
      {readiness && !readiness.ready && (
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto 24px',
            background: '#fff3f2',
            border: '1px solid #e7b3ad',
            color: '#7f1d1d',
            padding: '20px 24px',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px' }}>Client-facing export blocked</strong>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {readiness.issues.map((issue) => (
              <li key={issue} style={{ marginBottom: '6px' }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
      <BrandBoard clientName={clientName} brandKit={toBoardKit(kit)} />
    </div>
  )
}
