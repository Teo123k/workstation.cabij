import { Pool } from 'pg'

type BrandBoardRow = {
  brand_kit_id: string
  client_id: string
  client_name: string | null
  direction_name: string
  colors_json: unknown
  typography_json: unknown
  logo_direction: string | null
  photography_style: string | null
  social_media_vibe: string | null
  instagram_grid_style: string | null
  ad_content_style: string | null
  content_rules_json: unknown
  full_brand_kit_json: unknown
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

export const loadBrandBoard = async (brandKitId: string) => {
  const result = await getPool().query<BrandBoardRow>(
    `
      WITH kit AS (
        SELECT
          brand_kit_id,
          client_id,
          direction_name,
          colors_json,
          typography_json,
          logo_direction,
          photography_style,
          social_media_vibe,
          instagram_grid_style,
          ad_content_style,
          content_rules_json,
          full_brand_kit_json,
          updated_at
        FROM brand_kits
        WHERE brand_kit_id = $1

        UNION ALL

        SELECT
          brand_kit_id,
          client_id,
          direction_name,
          colors_json,
          typography_json,
          logo_direction,
          photography_style,
          social_media_vibe,
          instagram_grid_style,
          ad_content_style,
          content_rules_json,
          full_brand_kit_json,
          updated_at
        FROM brand_kit
        WHERE brand_kit_id = $1
      )
      SELECT
        kit.brand_kit_id,
        kit.client_id,
        COALESCE(clients.client_name, client.client_name) AS client_name,
        kit.direction_name,
        kit.colors_json,
        kit.typography_json,
        kit.logo_direction,
        kit.photography_style,
        kit.social_media_vibe,
        kit.instagram_grid_style,
        kit.ad_content_style,
        kit.content_rules_json,
        kit.full_brand_kit_json
      FROM kit
      LEFT JOIN clients ON clients.client_id = kit.client_id
      LEFT JOIN client ON client.client_id = kit.client_id
      ORDER BY kit.updated_at DESC NULLS LAST
      LIMIT 1
    `,
    [brandKitId],
  )

  return result.rows[0] || null
}

export type LoadedBrandBoard = NonNullable<Awaited<ReturnType<typeof loadBrandBoard>>>
