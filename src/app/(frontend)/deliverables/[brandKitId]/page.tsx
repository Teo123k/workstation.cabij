import { notFound } from 'next/navigation'
import React from 'react'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
import { loadMarketingDeliverables } from '@/lib/brand/load-marketing'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    brandKitId: string
  }>
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

export default async function DeliverablesPage({ params }: PageProps) {
  const { brandKitId } = await params
  const [kit, readiness] = await Promise.all([
    loadMarketingDeliverables(brandKitId),
    evaluateBrandExportReadiness(brandKitId, { requireMarketingStrategy: true }),
  ])

  if (!kit || !kit.marketing_strategy_json) {
    notFound()
  }

  const clientName = kit.client_name || 'Brand Client'
  const strategy = asRecord(kit.marketing_strategy_json)
  const instagramBio = strategy.instagram_bio
  const fiveAdHeadlines = strategy.five_ad_headlines
  const fiveAdPrimaryTexts = strategy.five_ad_primary_texts
  const emailWelcomeCopy = strategy.email_welcome_copy
  const websiteHeroCopy = strategy.website_hero_copy
  const tenPostIdeas = strategy.ten_post_ideas

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', padding: '64px', fontFamily: 'Inter, sans-serif', color: '#111' }}>
      {readiness && !readiness.ready && (
        <section
          style={{
            marginBottom: '32px',
            background: '#fff3f2',
            border: '1px solid #e7b3ad',
            color: '#7f1d1d',
            padding: '20px 24px',
            borderRadius: '8px',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px' }}>Deliverables export blocked</strong>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {readiness.issues.map((issue) => (
              <li key={issue} style={{ marginBottom: '6px' }}>
                {issue}
              </li>
            ))}
          </ul>
        </section>
      )}
      <header style={{ borderBottom: '2px solid #000', paddingBottom: '24px', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0 }}>Marketing Deliverables</h1>
        <h2 style={{ fontSize: '24px', fontWeight: 'normal', color: '#555', marginTop: '12px' }}>{clientName} // {kit.direction_name}</h2>
      </header>

      {Boolean(instagramBio) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Instagram Bio</h3>
          <p style={{ fontSize: '18px', whiteSpace: 'pre-wrap', marginTop: '16px' }}>{String(instagramBio)}</p>
        </section>
      )}

      {Boolean(fiveAdHeadlines) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Ad Headlines</h3>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            {Array.isArray(fiveAdHeadlines) 
              ? fiveAdHeadlines.map((item, i) => <li key={i} style={{ fontSize: '18px', marginBottom: '8px' }}>{String(item)}</li>)
              : <li style={{ fontSize: '18px' }}>{String(fiveAdHeadlines)}</li>}
          </ul>
        </section>
      )}

      {Boolean(fiveAdPrimaryTexts) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Ad Primary Copy</h3>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            {Array.isArray(fiveAdPrimaryTexts) 
              ? fiveAdPrimaryTexts.map((item, i) => <li key={i} style={{ fontSize: '18px', marginBottom: '16px' }}>{String(item)}</li>)
              : <li style={{ fontSize: '18px' }}>{String(fiveAdPrimaryTexts)}</li>}
          </ul>
        </section>
      )}

      {Boolean(emailWelcomeCopy) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Welcome Email Copy</h3>
          <div style={{ fontSize: '16px', whiteSpace: 'pre-wrap', marginTop: '16px', background: '#f9f9f9', padding: '24px', borderRadius: '8px' }}>
            {String(emailWelcomeCopy)}
          </div>
        </section>
      )}

      {Boolean(websiteHeroCopy) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Website Hero Copy</h3>
          <p style={{ fontSize: '18px', whiteSpace: 'pre-wrap', marginTop: '16px' }}>{String(websiteHeroCopy)}</p>
        </section>
      )}

      {Boolean(tenPostIdeas) && (
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Social Content Calendar Ideas</h3>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            {Array.isArray(tenPostIdeas) 
              ? tenPostIdeas.map((item, i) => <li key={i} style={{ fontSize: '18px', marginBottom: '12px' }}>
                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                </li>)
              : <li style={{ fontSize: '18px' }}>{String(tenPostIdeas)}</li>}
          </ul>
        </section>
      )}
    </div>
  )
}
