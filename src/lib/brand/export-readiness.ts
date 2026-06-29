import { Pool } from 'pg'

type ExportReadinessRow = {
  brand_kit_id: string
  client_id: string
  strategy_id: string | null
  kit_status: string | null
  client_name: string | null
  direction_name: string | null
  mission: string | null
  vision: string | null
  positioning: string | null
  unique_selling_prop: string | null
  audience_profile: string | null
  brand_personality: string | null
  tone_of_voice: string | null
  marketing_strategy_json: unknown
  evidence_count: number
  reference_asset_count: number
  approved_strategy_review_count: number
}

export type ExportReadinessResult = {
  ready: boolean
  brandKitId: string
  clientId: string
  clientName: string | null
  directionName: string | null
  issues: string[]
  checks: {
    approvedKit: boolean
    strategyFieldsComplete: boolean
    evidenceThresholdMet: boolean
    referenceThresholdMet: boolean
    passedQualityReview: boolean
    marketingStrategyReady: boolean
  }
}

const globalForBrandExportGate = globalThis as typeof globalThis & {
  exportReadinessPool?: Pool
}

const getPool = () => {
  if (!globalForBrandExportGate.exportReadinessPool) {
    globalForBrandExportGate.exportReadinessPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  return globalForBrandExportGate.exportReadinessPool
}

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0

const hasObjectContent = (value: unknown) =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0)

export async function evaluateBrandExportReadiness(
  brandKitId: string,
  options?: {
    requireMarketingStrategy?: boolean
  },
): Promise<ExportReadinessResult | null> {
  const requireMarketingStrategy = Boolean(options?.requireMarketingStrategy)
  const result = await getPool().query<ExportReadinessRow>(
    `
      WITH selected_kit AS (
        SELECT brand_kit_id, client_id, strategy_id, status, direction_name, updated_at
        FROM brand_kits
        WHERE brand_kit_id = $1

        UNION ALL

        SELECT brand_kit_id, client_id, strategy_id, status, direction_name, updated_at
        FROM brand_kit
        WHERE brand_kit_id = $1
      ),
      ranked_kit AS (
        SELECT *,
               row_number() over (partition by brand_kit_id order by updated_at desc nulls last) as row_rank
        FROM selected_kit
      ),
      chosen_kit AS (
        SELECT brand_kit_id, client_id, strategy_id, status, direction_name
        FROM ranked_kit
        WHERE row_rank = 1
      ),
      selected_strategy AS (
        SELECT
          strategy_id,
          client_id,
          mission,
          vision,
          positioning,
          unique_selling_prop,
          audience_profile,
          brand_personality,
          tone_of_voice,
          marketing_strategy_json,
          updated_at
        FROM brand_strategies
        WHERE strategy_id = (SELECT strategy_id FROM chosen_kit)

        UNION ALL

        SELECT
          strategy_id,
          client_id,
          mission,
          vision,
          positioning,
          unique_selling_prop,
          audience_profile,
          brand_personality,
          tone_of_voice,
          marketing_strategy_json,
          updated_at
        FROM brand_strategy
        WHERE strategy_id = (SELECT strategy_id FROM chosen_kit)
      ),
      ranked_strategy AS (
        SELECT *,
               row_number() over (partition by strategy_id order by updated_at desc nulls last) as row_rank
        FROM selected_strategy
      ),
      chosen_strategy AS (
        SELECT *
        FROM ranked_strategy
        WHERE row_rank = 1
      ),
      client_name_pick AS (
        SELECT client_id, client_name, 1 as source_priority FROM clients
        UNION ALL
        SELECT client_id, client_name, 2 as source_priority FROM client
      ),
      ranked_client AS (
        SELECT *,
               row_number() over (partition by client_id order by source_priority asc) as row_rank
        FROM client_name_pick
      )
      SELECT
        kit.brand_kit_id,
        kit.client_id,
        kit.strategy_id,
        kit.status as kit_status,
        rc.client_name,
        kit.direction_name,
        strategy.mission,
        strategy.vision,
        strategy.positioning,
        strategy.unique_selling_prop,
        strategy.audience_profile,
        strategy.brand_personality,
        strategy.tone_of_voice,
        strategy.marketing_strategy_json,
        (
          SELECT count(*)::int
          FROM evidence_item e
          WHERE e.client_id = kit.client_id
            AND COALESCE(e.status, 'active') <> 'rejected'
        ) as evidence_count,
        (
          SELECT count(*)::int
          FROM brand_asset a
          WHERE a.client_id = kit.client_id
            AND COALESCE(a.status, 'active') = 'active'
            AND COALESCE(a.public_url, a.file_url, '') <> ''
            AND COALESCE(a.public_url, a.file_url, '') NOT ILIKE 'https://example.com/%'
            AND COALESCE(a.public_url, a.file_url, '') NOT ILIKE '%payload-bridge-smoke%'
        ) as reference_asset_count,
        (
          SELECT count(*)::int
          FROM quality_review qr
          WHERE qr.client_id = kit.client_id
            AND (qr.strategy_id = kit.strategy_id OR qr.brand_kit_id = kit.brand_kit_id)
            AND COALESCE(qr.passed, false) = true
        ) as approved_strategy_review_count
      FROM chosen_kit kit
      LEFT JOIN chosen_strategy strategy ON strategy.strategy_id = kit.strategy_id
      LEFT JOIN ranked_client rc ON rc.client_id = kit.client_id AND rc.row_rank = 1
      LIMIT 1
    `,
    [brandKitId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  const checks = {
    approvedKit: row.kit_status === 'approved',
    strategyFieldsComplete:
      hasText(row.mission) &&
      hasText(row.vision) &&
      hasText(row.positioning) &&
      hasText(row.unique_selling_prop) &&
      hasText(row.audience_profile) &&
      hasText(row.brand_personality) &&
      hasText(row.tone_of_voice),
    evidenceThresholdMet: Number(row.evidence_count || 0) >= 2,
    referenceThresholdMet: Number(row.reference_asset_count || 0) >= 2,
    passedQualityReview: Number(row.approved_strategy_review_count || 0) >= 1,
    marketingStrategyReady: !requireMarketingStrategy || hasObjectContent(row.marketing_strategy_json),
  }

  const issues: string[] = []

  if (!checks.approvedKit) {
    issues.push('Brand kit must be approved before client-facing export.')
  }

  if (!checks.strategyFieldsComplete) {
    issues.push('Strategy foundation is incomplete. Mission, vision, positioning, USP, audience, personality, and tone must all be present.')
  }

  if (!checks.evidenceThresholdMet) {
    issues.push('At least 2 active evidence items are required before export.')
  }

  if (!checks.referenceThresholdMet) {
    issues.push('At least 2 real reference assets are required before export.')
  }

  if (!checks.passedQualityReview) {
    issues.push('A passed quality review linked to the strategy or kit is required before export.')
  }

  if (!checks.marketingStrategyReady) {
    issues.push('Marketing strategy content is missing, so the deliverables package is not ready.')
  }

  return {
    ready: Object.values(checks).every(Boolean),
    brandKitId: row.brand_kit_id,
    clientId: row.client_id,
    clientName: row.client_name,
    directionName: row.direction_name,
    issues,
    checks,
  }
}
