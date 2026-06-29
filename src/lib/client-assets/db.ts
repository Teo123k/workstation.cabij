import { getResearchPool } from '@/lib/research/db'

import { normalizeBrandAssetRole, type BrandAssetRole } from './roles'

export type ClientReferenceAsset = {
  brand_asset_id: string
  client_id: string
  asset_type: string
  role: BrandAssetRole
  file_url: string | null
  public_url: string | null
  metadata_json: Record<string, unknown> | null
  status: string
  created_at: string
}

export async function getClientReferenceOverview(clientId: string) {
  const pool = getResearchPool()
  const clientResult = await pool.query<{
    client_id: string
    client_name: string
    status: string
  }>(
    `
      select client_id, client_name, status
      from client
      where client_id = $1
      union all
      select client_id, client_name, status::text
      from clients
      where client_id = $1
      limit 1
    `,
    [clientId],
  )

  const assetResult = await pool.query<ClientReferenceAsset>(
    `
      select
        brand_asset_id,
        client_id,
        asset_type,
        role,
        file_url,
        public_url,
        metadata_json,
        status,
        created_at::text
      from brand_asset
      where client_id = $1
        and status = 'active'
      order by created_at desc
    `,
    [clientId],
  )

  const requestResult = await pool.query<{
    request_id: string
    role: string
    description: string | null
    priority: string
    status: string
  }>(
    `
      select request_id, role, description, priority, status
      from brand_image_request
      where client_id = $1
        and status = 'pending'
      order by
        case priority when 'required' then 1 when 'recommended' then 2 else 3 end,
        requested_at asc
    `,
    [clientId],
  )

  return {
    client: clientResult.rows[0] || null,
    assets: assetResult.rows.map((asset) => ({
      ...asset,
      role: normalizeBrandAssetRole(asset.role || ''),
    })),
    requests: requestResult.rows,
  }
}

export async function createClientReferenceAsset(params: {
  clientId: string
  role: string
  fileUrl: string
  publicUrl: string
  assetType: string
  referenceNotes?: string
  metadata: Record<string, unknown>
}) {
  const pool = getResearchPool()
  const normalizedRole = normalizeBrandAssetRole(params.role)
  const sourceRoles = Array.from(new Set([params.role, normalizedRole]))
  const result = await pool.query<{
    brand_asset_id: string
    client_id: string
    role: BrandAssetRole
    file_url: string
    public_url: string
  }>(
    `
      with inserted as (
        insert into brand_asset (
          client_id,
          asset_type,
          role,
          file_url,
          public_url,
          metadata_json,
          status
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, 'active')
        returning brand_asset_id, client_id, role, file_url, public_url
      ),
      matched_request as (
        update brand_image_request bir
        set
          status = 'received',
          brand_asset_id = inserted.brand_asset_id,
          received_at = now()
        from inserted
        where bir.client_id = inserted.client_id
          and bir.status = 'pending'
          and bir.role = any($7::text[])
        returning bir.request_id
      )
      select brand_asset_id, client_id, role, file_url, public_url
      from inserted
    `,
    [
      params.clientId,
      params.assetType,
      normalizedRole,
      params.fileUrl,
      params.publicUrl,
      JSON.stringify({
        ...params.metadata,
        storage: 'google_drive',
        source: 'payload_direct_upload',
        requested_role: params.role,
        normalized_role: normalizedRole,
        reference_notes: params.referenceNotes || '',
      }),
      sourceRoles,
    ],
  )

  return result.rows[0]
}

