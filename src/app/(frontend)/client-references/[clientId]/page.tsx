import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'

import { getClientReferenceOverview } from '@/lib/client-assets/db'
import { getRoleLabel, ROLE_OPTIONS } from '@/lib/client-assets/roles'
import config from '@/payload.config'

import { ClientReferenceUploadForm } from './ClientReferenceUploadForm'

import '../../styles.css'

export const dynamic = 'force-dynamic'

export default async function ClientReferencesPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { clientId } = await params

  if (!user) {
    return (
      <main className="reference-page">
        <section className="reference-shell">
          <p className="eyebrow">Branding OS</p>
          <h1>Admin login required</h1>
          <p>Log in to Payload first, then reopen this client reference page.</p>
          <Link className="reference-button" href="/admin">
            Open Payload admin
          </Link>
        </section>
      </main>
    )
  }

  const overview = await getClientReferenceOverview(clientId)
  const assetsByRole = new Map<string, number>()

  for (const asset of overview.assets) {
    assetsByRole.set(asset.role, (assetsByRole.get(asset.role) || 0) + 1)
  }

  return (
    <main className="reference-page">
      <section className="reference-shell">
        <div className="reference-header">
          <div>
            <p className="eyebrow">Client reference control</p>
            <h1>{overview.client?.client_name || clientId}</h1>
            <p className="reference-muted">
              Client ID: <code>{clientId}</code>
            </p>
          </div>
          <Link className="reference-button secondary" href="/admin/collections/brand-assets">
            Brand Assets
          </Link>
        </div>

        <div className="reference-grid">
          <section className="reference-panel">
            <h2>Upload to Google Drive</h2>
            <p>
              Use this when Telegram upload is inconvenient. Payload uploads directly to Google
              Drive and registers the file for the agent.
            </p>
            <ClientReferenceUploadForm clientId={clientId} />
          </section>

          <section className="reference-panel">
            <h2>Evidence checklist</h2>
            <div className="checklist">
              {ROLE_OPTIONS.map((role) => {
                const count = assetsByRole.get(role.value) || 0

                return (
                  <div className="checklist-row" key={role.value}>
                    <div>
                      <strong>{role.label}</strong>
                      <span>{role.description}</span>
                    </div>
                    <mark className={count ? 'done' : role.required ? 'missing' : ''}>
                      {count ? `${count} saved` : role.required ? 'required' : 'useful'}
                    </mark>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <section className="reference-panel">
          <h2>Saved Google Drive references</h2>
          {overview.assets.length ? (
            <div className="asset-table">
              {overview.assets.map((asset) => {
                const url = asset.public_url || asset.file_url || ''
                const driveId =
                  asset.metadata_json && typeof asset.metadata_json.google_drive_file_id === 'string'
                    ? asset.metadata_json.google_drive_file_id
                    : ''

                return (
                  <article className="asset-row" key={asset.brand_asset_id}>
                    <div>
                      <strong>{getRoleLabel(asset.role)}</strong>
                      <span>
                        {asset.brand_asset_id} · {asset.asset_type}
                      </span>
                      {driveId && <span>Drive file: {driveId}</span>}
                    </div>
                    {url && (
                      <a href={url} rel="noreferrer" target="_blank">
                        Open
                      </a>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="reference-muted">No references saved yet.</p>
          )}
        </section>

        {overview.requests.length > 0 && (
          <section className="reference-panel">
            <h2>Pending upload requests</h2>
            <div className="checklist">
              {overview.requests.map((request) => (
                <div className="checklist-row" key={request.request_id}>
                  <div>
                    <strong>{request.role}</strong>
                    <span>{request.description || 'Reference requested by the agent.'}</span>
                  </div>
                  <mark className={request.priority === 'required' ? 'missing' : ''}>
                    {request.priority}
                  </mark>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
