import { Pool } from 'pg'

type MarketingDeliverablesRow = {
  brand_kit_id: string
  client_id: string
  client_name: string | null
  direction_name: string
  marketing_strategy_json: any
}

const globalForPg = globalThis as typeof globalThis & {
  brandBoardPool?: Pool
}

const getPool = () => {
  if (!globalForPg.brandBoardPool) {
    globalForPg.brandBoardPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }
  return globalForPg.brandBoardPool
}

export const loadMarketingDeliverables = async (brandKitId: string) => {
  const result = await getPool().query<MarketingDeliverablesRow>(
    `
      SELECT
        k.brand_kit_id,
        k.client_id,
        COALESCE(c.client_name, c2.client_name) AS client_name,
        k.direction_name,
        s.marketing_strategy_json AS marketing_strategy_json
      FROM brand_kit k
      LEFT JOIN brand_strategy s ON s.strategy_id = k.strategy_id
      LEFT JOIN clients c ON c.client_id = k.client_id
      LEFT JOIN client c2 ON c2.client_id = k.client_id
      WHERE k.brand_kit_id = $1
      LIMIT 1
    `,
    [brandKitId],
  )

  return result.rows[0] || null
}

export type LoadedMarketingDeliverables = NonNullable<Awaited<ReturnType<typeof loadMarketingDeliverables>>>
