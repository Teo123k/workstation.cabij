import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'

import { ClientIntakeForm } from '../ClientIntakeForm'

import '../../styles.css'

export const dynamic = 'force-dynamic'

export default async function NewClientIntakePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <main className="reference-page">
        <section className="reference-shell">
          <p className="eyebrow">Branding OS</p>
          <h1>Login required</h1>
          <p>Create the project after signing in to Payload.</p>
          <Link className="reference-button" href="/admin">
            Open admin
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="reference-page">
      <section className="reference-shell">
        <div className="reference-header">
          <div>
            <p className="eyebrow">Payload-first intake</p>
            <h1>Create client project</h1>
            <p className="reference-muted">
              Start the project here, then continue reference upload and delivery from the client workspace.
            </p>
          </div>
          <Link className="reference-button secondary" href="/clients">
            Back to clients
          </Link>
        </div>

        <section className="reference-panel">
          <h2>Client intake</h2>
          <p>
            This form creates the client record and saves a structured brief that the Telegram bot, workflows, and
            workspace can all work against.
          </p>
          <ClientIntakeForm mode="create" />
        </section>
      </section>
    </main>
  )
}
