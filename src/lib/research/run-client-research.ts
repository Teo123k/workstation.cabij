import crypto from 'crypto'

import { getResearchPool } from './db'
import { compactText, tavilyExtract, tavilySearch } from './tavily'

type ResearchRequest = {
  clientId: string
  businessName?: string
  industry?: string
  location?: string
  audience?: string
  researchGoal: string
  includeDomains?: string[]
  excludeDomains?: string[]
  maxResults?: number
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  extractTopResults?: number
}

type ClientRow = {
  client_name: string | null
}

const prefixedId = (prefix: string) =>
  `${prefix}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`

const buildQuery = (input: Required<Pick<ResearchRequest, 'businessName' | 'researchGoal'>> & Partial<ResearchRequest>) => {
  const parts = [
    input.businessName,
    input.industry ? `industry: ${input.industry}` : '',
    input.location ? `location: ${input.location}` : '',
    input.audience ? `audience: ${input.audience}` : '',
    `goal: ${input.researchGoal}`,
  ]

  return parts.filter(Boolean).join(' | ')
}

export const runClientResearch = async (input: ResearchRequest) => {
  const pool = getResearchPool()
  const startedAt = new Date()
  const agentRunId = prefixedId('AR')

  const clientResult = await pool.query<ClientRow>(
    `
      SELECT COALESCE(clients.client_name, client.client_name) AS client_name
      FROM (
        SELECT $1::text AS client_id
      ) request
      LEFT JOIN clients ON clients.client_id = request.client_id
      LEFT JOIN client ON client.client_id = request.client_id
      LIMIT 1
    `,
    [input.clientId],
  )

  const resolvedBusinessName = input.businessName || clientResult.rows[0]?.client_name || ''

  if (!resolvedBusinessName) {
    throw new Error('Could not resolve business name for research request')
  }

  const query = buildQuery({
    businessName: resolvedBusinessName,
    industry: input.industry,
    location: input.location,
    audience: input.audience,
    researchGoal: input.researchGoal,
  })

  const searchResponse = await tavilySearch({
    query,
    searchDepth: input.searchDepth ?? 'basic',
    maxResults: input.maxResults ?? 5,
    includeDomains: input.includeDomains,
    excludeDomains: input.excludeDomains,
    country: input.location ? 'united kingdom' : undefined,
  })

  const urlsToExtract = searchResponse.results
    .map((result) => result.url)
    .filter(Boolean)
    .slice(0, Math.max(0, Math.min(input.extractTopResults ?? 3, 5)))

  const extractResponse =
    urlsToExtract.length > 0
      ? await tavilyExtract({
          urls: urlsToExtract,
          query,
          extractDepth: 'basic',
        })
      : null

  const extractByUrl = new Map(
    (extractResponse?.results || []).map((result) => [result.url, compactText(result.raw_content, 1200)]),
  )

  const sourceRows = []
  const evidenceRows = []

  for (const result of searchResponse.results) {
    const sourceId = prefixedId('RS')
    const evidenceId = prefixedId('EV')
    const snippet = compactText(result.content, 400)
    const extractedContent = extractByUrl.get(result.url) || ''

    await pool.query(
      `
        INSERT INTO research_source (
          source_id, client_id, title, url, source_type, snippet, source_json, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      `,
      [
        sourceId,
        input.clientId,
        compactText(result.title, 180) || result.url,
        result.url,
        'website',
        snippet,
        JSON.stringify({
          score: result.score ?? null,
          favicon: result.favicon ?? null,
          query,
          tavily_request_id: searchResponse.request_id ?? null,
          extract_request_id: extractResponse?.request_id ?? null,
          extracted_content: extractedContent,
        }),
        'active',
        'system',
      ],
    )

    await pool.query(
      `
        INSERT INTO evidence_item (
          evidence_id, client_id, source_id, evidence_type, claim_text, evidence_json, confidence, status
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      `,
      [
        evidenceId,
        input.clientId,
        sourceId,
        'research_fact',
        snippet || compactText(extractedContent, 400) || `Source captured from ${result.url}`,
        JSON.stringify({
          title: result.title ?? null,
          url: result.url,
          score: result.score ?? null,
          extracted_excerpt: compactText(extractedContent, 600),
          research_goal: input.researchGoal,
        }),
        Math.max(1, Math.min(100, Math.round((result.score ?? 0.7) * 100))),
        'active',
      ],
    )

    sourceRows.push({
      source_id: sourceId,
      title: result.title ?? result.url,
      url: result.url,
      snippet,
    })
    evidenceRows.push({
      evidence_id: evidenceId,
      claim_text: snippet || compactText(extractedContent, 250),
      source_id: sourceId,
    })
  }

  const summaryLines = sourceRows.slice(0, 5).map((row, index) => `${index + 1}. ${row.title}: ${row.snippet}`)

  await pool.query(
    `
      INSERT INTO agent_run (
        agent_run_id, client_id, run_type, action_name, model_name, tool_name, input_json, output_json,
        status, started_at, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, now())
    `,
    [
      agentRunId,
      input.clientId,
      'workflow',
      'tavily_client_research',
      'tavily',
      'search+extract',
      JSON.stringify({
        business_name: resolvedBusinessName,
        industry: input.industry ?? null,
        location: input.location ?? null,
        audience: input.audience ?? null,
        research_goal: input.researchGoal,
        include_domains: input.includeDomains ?? [],
        exclude_domains: input.excludeDomains ?? [],
      }),
      JSON.stringify({
        query,
        sources_saved: sourceRows.length,
        evidence_saved: evidenceRows.length,
        tavily_search_request_id: searchResponse.request_id ?? null,
        tavily_extract_request_id: extractResponse?.request_id ?? null,
        search_credits: searchResponse.usage?.credits ?? null,
        extract_credits: extractResponse?.usage?.credits ?? null,
      }),
      'completed',
      startedAt,
    ],
  )

  return {
    agent_run_id: agentRunId,
    client_id: input.clientId,
    business_name: resolvedBusinessName,
    query,
    sources_saved: sourceRows.length,
    evidence_saved: evidenceRows.length,
    search_credits: searchResponse.usage?.credits ?? null,
    extract_credits: extractResponse?.usage?.credits ?? null,
    search_request_id: searchResponse.request_id ?? null,
    extract_request_id: extractResponse?.request_id ?? null,
    summary: summaryLines.join('\n'),
    sources: sourceRows,
    evidence: evidenceRows,
  }
}
