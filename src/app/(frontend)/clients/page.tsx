import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'

import { getClientSummaries } from '@/lib/client-workspace/db'
import config from '@/payload.config'
import { ClientList } from './components/ClientList'

import '../styles.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    q?: string
    view?: string
  }>
}

const formatDate = (value: string | null) => {
  if (!value) return 'No activity yet'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const deriveClientState = (client: Awaited<ReturnType<typeof getClientSummaries>>[number]) => {
  if (client.brief_count === 0) {
    return {
      nextAction: 'Add brief',
      tone: 'needs-attention',
      view: 'brief',
      summary: 'No brief recorded yet',
    }
  }

  if (client.strategy_count === 0) {
    return {
      nextAction: 'Generate strategy',
      tone: 'needs-attention',
      view: 'strategy',
      summary: 'Brief exists but no strategy',
    }
  }

  if (client.asset_count === 0) {
    return {
      nextAction: 'Upload references',
      tone: 'waiting',
      view: 'references',
      summary: 'Strategy exists but evidence pack is thin',
    }
  }

  if (client.approved_kit_count === 0) {
    return {
      nextAction: 'Create or approve kit',
      tone: 'in-progress',
      view: 'kit',
      summary: 'References available, visual identity not approved',
    }
  }

  if (client.export_count === 0) {
    return {
      nextAction: 'Export deliverables',
      tone: 'ready',
      view: 'export',
      summary: 'Approved direction ready for handover',
    }
  }

  return {
    nextAction: 'Review handover',
    tone: 'ready',
    view: 'complete',
    summary: 'Client-facing files already exported',
  }
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const [{ q = '', view = 'all' }, headers] = await Promise.all([searchParams, getHeaders()])
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <main className="workstation-page">
        <section className="workstation-empty">
          <p className="eyebrow">Branding OS</p>
          <h1>Login required</h1>
          <p>Open the workstation after signing in to Payload.</p>

        </section>
      </main>
    )
  }

  const clients = await getClientSummaries()
  const search = q.trim().toLowerCase()
  const enriched = clients.map((client) => ({
    ...client,
    state: deriveClientState(client),
  }))

  const filtered = enriched.filter((client) => {
    const matchesSearch =
      !search ||
      client.client_name.toLowerCase().includes(search) ||
      client.client_id.toLowerCase().includes(search)

    const matchesView = view === 'all' || client.state.view === view

    return matchesSearch && matchesView
  })

  const totals = {
    all: enriched.length,
    brief: enriched.filter((client) => client.state.view === 'brief').length,
    strategy: enriched.filter((client) => client.state.view === 'strategy').length,
    references: enriched.filter((client) => client.state.view === 'references').length,
    kit: enriched.filter((client) => client.state.view === 'kit').length,
    export: enriched.filter((client) => client.state.view === 'export').length,
    complete: enriched.filter((client) => client.state.view === 'complete').length,
  }

  const activeViewLabel = {
    all: 'All clients',
    brief: 'Needs brief',
    strategy: 'Needs strategy',
    references: 'Needs references',
    kit: 'Needs approval',
    export: 'Ready to export',
    complete: 'Completed',
  }[view] || 'All clients'

  return (
    <main className="workstation-page">
      <section className="workstation-shell">
        <header className="workstation-topbar">
          <div>
            <p className="eyebrow">Cabij Branding OS</p>
            <h1>Client workspaces</h1>
            <p className="workspace-subtitle">
              One place to find the right client, see what is missing, and jump into the next real task.
            </p>
          </div>
          <div className="workstation-actions">
            <Link className="reference-button" href="/intake/new">
              New intake
            </Link>

          </div>
        </header>

        <section className="workspace-grid client-summary-grid">
          <article className="workspace-panel">
            <span className="panel-label">Total clients</span>
            <strong>{totals.all}</strong>
            <p>All live client records across intake and production tables.</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Needs intake</span>
            <strong>{totals.brief}</strong>
            <p>Clients without a usable brief yet.</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Needs evidence</span>
            <strong>{totals.references}</strong>
            <p>Strategy exists, but references are still missing.</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Ready for export</span>
            <strong>{totals.export + totals.complete}</strong>
            <p>Approved work that can be reviewed or handed over.</p>
          </article>
        </section>

        <section className="workspace-section workspace-toolbar">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Find clients fast</p>
              <h2>{activeViewLabel}</h2>
            </div>
          </div>

          <form className="toolbar-form" method="get">
            <label className="toolbar-search">
              <span className="toolbar-label">Search by client name or client ID</span>
              <input
                className="toolbar-input"
                defaultValue={q}
                name="q"
                placeholder="Search client name or ID"
                type="search"
              />
            </label>
            <input name="view" type="hidden" value={view} />
            <button className="reference-button" type="submit">
              Search
            </button>
            {q ? (
              <Link className="reference-button secondary" href={`/clients${view !== 'all' ? `?view=${view}` : ''}`}>
                Clear
              </Link>
            ) : null}
          </form>

          <div className="toolbar-chips" aria-label="Client filters">
            {[
              ['all', `All (${totals.all})`],
              ['brief', `Needs brief (${totals.brief})`],
              ['strategy', `Needs strategy (${totals.strategy})`],
              ['references', `Needs refs (${totals.references})`],
              ['kit', `Needs approval (${totals.kit})`],
              ['export', `Ready to export (${totals.export})`],
              ['complete', `Completed (${totals.complete})`],
            ].map(([key, label]) => {
              const href = key === 'all'
                ? q
                  ? `/clients?q=${encodeURIComponent(q)}`
                  : '/clients'
                : `/clients?view=${encodeURIComponent(key)}${q ? `&q=${encodeURIComponent(q)}` : ''}`

              return (
                <Link
                  className={`toolbar-chip${view === key ? ' active' : ''}`}
                  href={href}
                  key={key}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="workspace-section">
          <ClientList clients={filtered} />
        </section>
      </section>
    </main>
  )
}
