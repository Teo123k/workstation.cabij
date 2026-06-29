import { headers as getHeaders } from 'next/headers.js'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { runClientResearch } from '@/lib/research/run-client-research'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

async function requirePayloadUser() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return user
}

export async function POST(request: Request) {
  const user = await requirePayloadUser()

  if (!user) {
    return NextResponse.json({ error: 'Payload admin login required' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  const clientId = String(body.client_id || '').trim()
  const researchGoal = String(body.research_goal || '').trim()

  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }

  if (!researchGoal) {
    return NextResponse.json({ error: 'research_goal is required' }, { status: 400 })
  }

  try {
    const result = await runClientResearch({
      clientId,
      businessName: body.business_name ? String(body.business_name) : undefined,
      industry: body.industry ? String(body.industry) : undefined,
      location: body.location ? String(body.location) : undefined,
      audience: body.audience ? String(body.audience) : undefined,
      researchGoal,
      includeDomains: Array.isArray(body.include_domains) ? body.include_domains.map(String) : undefined,
      excludeDomains: Array.isArray(body.exclude_domains) ? body.exclude_domains.map(String) : undefined,
      maxResults: Number.isFinite(Number(body.max_results)) ? Number(body.max_results) : undefined,
      searchDepth:
        body.search_depth === 'advanced' ||
        body.search_depth === 'fast' ||
        body.search_depth === 'ultra-fast' ||
        body.search_depth === 'basic'
          ? body.search_depth
          : undefined,
      extractTopResults: Number.isFinite(Number(body.extract_top_results))
        ? Number(body.extract_top_results)
        : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ error: 'Research request failed', details }, { status: 500 })
  }
}
