import { getResearchPool } from '@/lib/research/db'

export type ClientSummary = {
  client_id: string
  client_name: string
  status: string
  created_at: string | null
  brief_count: number
  strategy_count: number
  kit_count: number
  approved_kit_count: number
  asset_count: number
  export_count: number
  latest_activity_at: string | null
}

export type ClientWorkspace = {
  client: {
    client_id: string
    client_name: string
    status: string
    origin_lead_id: string | null
    owner: string | null
    created_at: string | null
  } | null
  briefs: Array<Record<string, unknown>>
  strategies: Array<Record<string, unknown>>
  kits: Array<Record<string, unknown>>
  assets: Array<Record<string, unknown>>
  exports: Array<Record<string, unknown>>
  evidence: Array<Record<string, unknown>>
  decisions: Array<Record<string, unknown>>
  qualityReviews: Array<Record<string, unknown>>
  agentRuns: Array<Record<string, unknown>>
  feedback: Array<Record<string, unknown>>
  pendingRequests: Array<Record<string, unknown>>
  agencyBrainStats: Array<Record<string, unknown>>
}

const rows = <T extends Record<string, unknown>>(result: { rows: T[] }) => result.rows

export async function getClientSummaries(): Promise<ClientSummary[]> {
  const pool = getResearchPool()
  const result = await pool.query<ClientSummary>(`
    with ranked_clients as (
      select
        client_id, client_name, status, origin_lead_id, owner, created_at, source_priority
      from (
        select
          client_id,
          client_name,
          status::text as status,
          origin_lead_id,
          owner,
          created_at,
          1 as source_priority
        from clients
        union all
        select
          client_id,
          client_name,
          status::text as status,
          origin_lead_id,
          owner,
          created_at,
          2 as source_priority
        from client
      ) combined
    ),
    base_clients as (
      select client_id, client_name, status, origin_lead_id, owner, created_at
      from (
        select
          *,
          row_number() over (
            partition by client_id
            order by source_priority asc, created_at desc nulls last
          ) as row_rank
        from ranked_clients
      ) deduped
      where row_rank = 1
    ),
    activity as (
      select client_id, max(created_at) as latest_activity_at
      from (
        select client_id, created_at from brand_brief
        union all select client_id, created_at from brand_strategy
        union all select client_id, created_at from brand_kit
        union all select client_id, created_at from brand_asset
        union all select client_id, created_at from brand_export
      ) events
      group by client_id
    )
    select
      c.client_id,
      c.client_name,
      c.status,
      c.created_at::text,
      (select count(*)::int from brand_brief b where b.client_id = c.client_id) as brief_count,
      (select count(*)::int from brand_strategy s where s.client_id = c.client_id) as strategy_count,
      (select count(*)::int from brand_kit k where k.client_id = c.client_id) as kit_count,
      (select count(*)::int from brand_kit k where k.client_id = c.client_id and k.status = 'approved') as approved_kit_count,
      (select count(*)::int from brand_asset a where a.client_id = c.client_id) as asset_count,
      (select count(*)::int from brand_export e where e.client_id = c.client_id) as export_count,
      activity.latest_activity_at::text
    from base_clients c
    left join activity on activity.client_id = c.client_id
    order by coalesce(activity.latest_activity_at, c.created_at) desc nulls last, c.client_name asc
  `)

  return result.rows
}

export async function getClientWorkspace(clientId: string): Promise<ClientWorkspace> {
  const pool = getResearchPool()
  const [
    client,
    briefs,
    strategies,
    kits,
    assets,
    exports,
    evidence,
    decisions,
    qualityReviews,
    agentRuns,
    feedback,
    pendingRequests,
    agencyBrainStats,
  ] = await Promise.all([
    pool.query(
      `
        select client_id, client_name, status::text, origin_lead_id, owner, created_at::text
        from clients
        where client_id = $1
        union all
        select client_id, client_name, status::text, origin_lead_id, owner, created_at::text
        from client
        where client_id = $1
        limit 1
      `,
      [clientId],
    ),
    pool.query(
      `
        select brief_id, raw_brief, extracted_brief_json, status, created_at::text, updated_at::text
        from brand_brief
        where client_id = $1
        order by updated_at desc, created_at desc
        limit 5
      `,
      [clientId],
    ),
    pool.query(
      `
        select
          strategy_id, brief_id, company_summary, positioning, mission, vision,
          unique_selling_prop, audience_profile, brand_personality, tone_of_voice,
          competitor_gap, social_media_direction, status, version, created_at::text, updated_at::text
        from brand_strategy
        where client_id = $1
        order by updated_at desc, created_at desc
        limit 5
      `,
      [clientId],
    ),
    pool.query(
      `
        select
          brand_kit_id, strategy_id, direction_name, status, colors_json, typography_json,
          logo_direction, photography_style, social_media_vibe, approved_at::text,
          created_at::text, updated_at::text
        from brand_kit
        where client_id = $1
        order by
          case status when 'approved' then 1 when 'draft' then 2 else 3 end,
          updated_at desc,
          created_at desc
      `,
      [clientId],
    ),
    pool.query(
      `
        select brand_asset_id, brand_kit_id, asset_type, role, public_url, file_url, status, created_at::text
        from brand_asset
        where client_id = $1
        order by created_at desc
        limit 12
      `,
      [clientId],
    ),
    pool.query(
      `
        select export_id, brand_kit_id, export_type, export_url, deliverable_label, is_client_facing, created_at::text
        from brand_export
        where client_id = $1
        order by created_at desc
        limit 10
      `,
      [clientId],
    ),
    pool.query(
      `select 1 as dummy where 1=0`
    ),
    pool.query(
      `select 1 as dummy where 1=0`
    ),
    pool.query(
      `select 1 as dummy where 1=0`
    ),
    pool.query(
      `select 1 as dummy where 1=0`
    ),
    pool.query(
      `select 1 as dummy where 1=0`
    ),
    pool.query(
      `
        select request_id, role, description, priority, status, requested_at::text
        from brand_image_request
        where client_id = $1
          and status = 'pending'
        order by case priority when 'required' then 1 when 'recommended' then 2 else 3 end, requested_at asc
      `,
      [clientId],
    ),
    pool.query(`
      select task_key, knowledge_type, token_weight, count(*)::int as count
      from agency_knowledge_bases
      where status = 'active'
      group by task_key, knowledge_type, token_weight
      order by task_key, knowledge_type, token_weight
    `),
  ])

  return {
    client: (client.rows[0] as ClientWorkspace['client']) || null,
    briefs: rows(briefs),
    strategies: rows(strategies),
    kits: rows(kits),
    assets: rows(assets),
    exports: rows(exports),
    evidence: rows(evidence),
    decisions: rows(decisions),
    qualityReviews: rows(qualityReviews),
    agentRuns: rows(agentRuns),
    feedback: rows(feedback),
    pendingRequests: rows(pendingRequests),
    agencyBrainStats: rows(agencyBrainStats),
  }
}
