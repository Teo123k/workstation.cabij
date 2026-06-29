import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { toIntakeDefaults } from '@/lib/client-intake/brief'
import { getClientWorkspace } from '@/lib/client-workspace/db'
import config from '@/payload.config'

import { ClientIntakeForm } from '../ClientIntakeForm'

import '../../styles.css'

export const dynamic = 'force-dynamic'

export default async function EditClientIntakePage({
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
          <h1>Login required</h1>
          <p>Update the project after signing in to Payload.</p>
          <Link className="reference-button" href="/admin">
            Open admin
          </Link>
        </section>
      </main>
    )
  }

  const workspace = await getClientWorkspace(clientId)

  if (!workspace.client) {
    notFound()
  }

  const defaults = toIntakeDefaults(workspace.client, workspace.briefs[0] || null)

  return (
    <main className="reference-page">
      <section className="reference-shell">
        <div className="reference-header">
          <div>
            <p className="eyebrow">Payload-first intake</p>
            <h1>{workspace.client.client_name}</h1>
            <p className="reference-muted">
              Update intake data for client ID <code>{workspace.client.client_id}</code>.
            </p>
          </div>
          <div className="workstation-actions">
            <Link className="reference-button secondary" href={`/clients/${workspace.client.client_id}`}>
              Workspace
            </Link>
            <Link className="reference-button secondary" href={`/client-references/${workspace.client.client_id}`}>
              References
            </Link>
          </div>
        </div>

        <section className="reference-panel">
          <h2>Client intake</h2>
          <p>
            Keep the structured brief, contact details, and requested deliverables current here so Telegram and n8n can
            operate against the same source of truth.
          </p>
          <ClientIntakeForm defaults={defaults} mode="edit" />
        </section>
      </section>
    </main>
  )
}
