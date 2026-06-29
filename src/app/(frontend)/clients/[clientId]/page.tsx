import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
import { getClientWorkspace } from '@/lib/client-workspace/db'
import config from '@/payload.config'

import '../../styles.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    clientId: string
  }>
}

const text = (value: unknown, fallback = 'Not recorded') => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const shortText = (value: unknown, length = 180) => {
  const clean = text(value, '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'Not recorded'
  return clean.length > length ? `${clean.slice(0, length).trim()}...` : clean
}

const formatDate = (value: unknown) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(String(value)))
}

const first = <T,>(items: T[]) => items[0]

const deriveWorkspaceState = ({
  hasBrief,
  hasReferences,
  hasStrategy,
  hasApprovedKit,
  hasExport,
}: {
  hasBrief: boolean
  hasReferences: boolean
  hasStrategy: boolean
  hasApprovedKit: boolean
  hasExport: boolean
}) => {
  if (!hasBrief) {
    return {
      nextStep: 'Capture the working brand brief',
      detail: 'This project needs its core business context, offer, audience, and goals locked first.',
    }
  }

  if (!hasReferences) {
    return {
      nextStep: 'Upload real references and source images',
      detail: 'Before creative generation, add product photos, inspiration, competitor references, and brand evidence.',
    }
  }

  if (!hasStrategy) {
    return {
      nextStep: 'Generate or refine the strategy',
      detail: 'The brief and evidence are ready. The next move is a stronger strategic foundation for creative work.',
    }
  }

  if (!hasApprovedKit) {
    return {
      nextStep: 'Review and approve one visual direction',
      detail: 'Strategy exists, but the project still needs an approved identity system before handover.',
    }
  }

  if (!hasExport) {
    return {
      nextStep: 'Export the client-facing deliverables',
      detail: 'The approved direction is ready to turn into handover files and presentation assets.',
    }
  }

  return {
    nextStep: 'Review the handover pack',
    detail: 'Core strategy, identity, and exports are all in place. Final review can happen from this workspace.',
  }
}

export default async function ClientWorkspacePage({ params }: PageProps) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { clientId } = await params

  if (!user) {
    return (
      <main className="workstation-page">
        <section className="workstation-empty">
          <p className="eyebrow">Branding OS</p>
          <h1>Login required</h1>
          <p>Log in to Payload first, then reopen this client workspace.</p>
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

  const latestBrief = first(workspace.briefs)
  const latestStrategy = first(workspace.strategies)
  const approvedKit = workspace.kits.find((kit) => kit.status === 'approved')
  const latestKit = approvedKit || first(workspace.kits)
  const hasBrief = Boolean(latestBrief)
  const hasReferences = workspace.assets.length > 0
  const hasStrategy = Boolean(latestStrategy)
  const hasApprovedKit = Boolean(approvedKit)
  const hasExport = workspace.exports.length > 0
  const workspaceState = deriveWorkspaceState({
    hasBrief,
    hasReferences,
    hasStrategy,
    hasApprovedKit,
    hasExport,
  })
  const missingItems = [
    !hasBrief ? 'Brand brief not recorded yet' : null,
    !hasReferences ? 'Reference images and evidence pack still missing' : null,
    !hasStrategy ? 'No saved strategy yet' : null,
    !hasApprovedKit ? 'No approved brand direction yet' : null,
    !hasExport ? 'No export or handover file generated yet' : null,
  ].filter(Boolean) as string[]
  const exportReadiness =
    latestKit && typeof latestKit.brand_kit_id === 'string'
      ? await evaluateBrandExportReadiness(String(latestKit.brand_kit_id), {
          requireMarketingStrategy: false,
        })
      : null
  const strategyBrainCount = workspace.agencyBrainStats
    .filter((row) => row.task_key === 'brand_strategy' || row.task_key === 'global')
    .reduce((total, row) => total + Number(row.count || 0), 0)

  return (
    <main className="workstation-page">
      <section className="workstation-shell">
        <header className="workstation-topbar">
          <div>
            <Link className="workspace-back" href="/clients">
              Clients
            </Link>
            <p className="eyebrow">Client workspace</p>
            <h1>{workspace.client.client_name}</h1>
            <p className="workspace-subtitle">
              {workspace.client.client_id} · {workspace.client.status}
            </p>
          </div>
          <div className="workstation-actions">
            <Link className="reference-button" href={`/intake/${workspace.client.client_id}`}>
              Intake
            </Link>
            <Link className="reference-button secondary" href={`/client-references/${workspace.client.client_id}`}>
              References
            </Link>
            <Link className="reference-button secondary" href="/admin/collections/clients">
              Admin
            </Link>
          </div>
        </header>

        <nav className="workspace-tabs" aria-label="Client workspace sections">
          <a href="#brief">Brief</a>
          <a href="#references">References</a>
          <a href="#strategy">Strategy</a>
          <a href="#directions">Directions</a>
          <a href="#deliverables">Deliverables</a>
          <a href="#qa">QA</a>
          <a href="#brain">Agency Brain</a>
        </nav>

        <section className="workspace-overview">
          <div className="overview-hero">
            <article className="overview-callout">
              <p className="eyebrow">What to do next</p>
              <strong>{workspaceState.nextStep}</strong>
              <p>{workspaceState.detail}</p>
              <div className="overview-list">
                <div>
                  <span>Current stage</span>
                  <strong>{text(workspace.client.status)}</strong>
                </div>
                <div>
                  <span>Most recent activity</span>
                  <strong>
                    {formatDate(
                      first(workspace.agentRuns)?.created_at ||
                        first(workspace.exports)?.created_at ||
                        first(workspace.kits)?.updated_at ||
                        first(workspace.strategies)?.updated_at ||
                        first(workspace.briefs)?.updated_at ||
                        workspace.client.created_at,
                    ) || 'Not recorded'}
                  </strong>
                </div>
              </div>
            </article>

            <article className="overview-checklist">
              <p className="eyebrow">Project status</p>
              <strong>{missingItems.length ? `${missingItems.length} gaps still open` : 'Core production path complete'}</strong>
              {missingItems.length ? (
                <ul className="overview-bullets">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>This client has the minimum core records needed for a professional handover review.</p>
              )}
            </article>
          </div>
        </section>

        <section className="workspace-grid">
          <article className="workspace-panel">
            <span className="panel-label">Briefs</span>
            <strong>{workspace.briefs.length}</strong>
            <p>{latestBrief ? shortText(latestBrief.raw_brief, 120) : 'No brief saved yet.'}</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Strategy</span>
            <strong>{workspace.strategies.length}</strong>
            <p>{latestStrategy ? shortText(latestStrategy.positioning, 120) : 'No strategy generated yet.'}</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Brand directions</span>
            <strong>{workspace.kits.length}</strong>
            <p>{latestKit ? text(latestKit.direction_name) : 'No direction generated yet.'}</p>
          </article>
          <article className="workspace-panel">
            <span className="panel-label">Exports</span>
            <strong>{workspace.exports.length}</strong>
            <p>{workspace.exports.length ? 'Client-facing files are available below.' : 'No exports yet.'}</p>
          </article>
        </section>

        <div className="workspace-layout">
          <section className="workspace-main">
            <article className="workspace-section" id="brief">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Intake</p>
                  <h2>Brief</h2>
                </div>
              </div>
              {workspace.briefs.length ? (
                workspace.briefs.map((brief) => (
                  <div className="workspace-record" key={text(brief.brief_id)}>
                    <div>
                      <strong>{text(brief.brief_id)}</strong>
                      <span>{formatDate(brief.updated_at || brief.created_at)}</span>
                    </div>
                    <p>{shortText(brief.raw_brief, 420)}</p>
                  </div>
                ))
              ) : (
                <p className="workspace-muted">No brief has been saved for this client yet.</p>
              )}
            </article>

            <article className="workspace-section" id="references">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Evidence</p>
                  <h2>References</h2>
                </div>
                <Link className="reference-button secondary" href={`/client-references/${workspace.client.client_id}`}>
                  Upload
                </Link>
              </div>
              <div className="workspace-list">
                {workspace.assets.map((asset) => (
                  <div className="workspace-record compact" key={text(asset.brand_asset_id)}>
                    <div>
                      <strong>{text(asset.role)}</strong>
                      <span>{text(asset.brand_asset_id)} · {text(asset.asset_type)}</span>
                    </div>
                    {Boolean(asset.public_url || asset.file_url) && (
                      <a href={String(asset.public_url || asset.file_url)} rel="noreferrer" target="_blank">
                        Open
                      </a>
                    )}
                  </div>
                ))}
                {!workspace.assets.length && <p className="workspace-muted">No reference assets saved yet.</p>}
              </div>
              {workspace.pendingRequests.length > 0 && (
                <div className="workspace-note">
                  {workspace.pendingRequests.length} pending upload request
                  {workspace.pendingRequests.length === 1 ? '' : 's'} for this client.
                </div>
              )}
            </article>

            <article className="workspace-section" id="strategy">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Director view</p>
                  <h2>Strategy</h2>
                </div>
              </div>
              {workspace.strategies.length ? (
                workspace.strategies.map((strategy) => (
                  <div className="workspace-record" key={text(strategy.strategy_id)}>
                    <div>
                      <strong>{text(strategy.strategy_id)}</strong>
                      <span>{text(strategy.status)} · v{text(strategy.version)}</span>
                    </div>
                    <p>{shortText(strategy.positioning, 420)}</p>
                    <dl className="workspace-facts">
                      <div>
                        <dt>USP</dt>
                        <dd>{shortText(strategy.unique_selling_prop, 120)}</dd>
                      </div>
                      <div>
                        <dt>Voice</dt>
                        <dd>{shortText(strategy.tone_of_voice, 120)}</dd>
                      </div>
                    </dl>
                  </div>
                ))
              ) : (
                <p className="workspace-muted">No strategy has been generated yet.</p>
              )}
            </article>

            <article className="workspace-section" id="directions">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Creative direction</p>
                  <h2>Brand directions</h2>
                </div>
              </div>
              <div className="kit-grid">
                {workspace.kits.map((kit) => (
                  <article className="kit-card" key={text(kit.brand_kit_id)}>
                    <header>
                      <strong>{text(kit.direction_name)}</strong>
                      <mark className={kit.status === 'approved' ? 'status-good' : ''}>{text(kit.status)}</mark>
                    </header>
                    <p>{shortText(kit.photography_style || kit.social_media_vibe || kit.logo_direction, 160)}</p>
                    <div className="kit-actions">
                      <Link href={`/brand-board/${kit.brand_kit_id}`}>Brand board</Link>
                      <Link href={`/deliverables/${kit.brand_kit_id}`}>Deliverables</Link>
                    </div>
                  </article>
                ))}
                {!workspace.kits.length && <p className="workspace-muted">No brand directions generated yet.</p>}
              </div>
            </article>

            <article className="workspace-section" id="deliverables">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Client-ready output</p>
                  <h2>Exports</h2>
                </div>
              </div>
              {exportReadiness && !exportReadiness.ready && (
                <div className="workspace-note">
                  Export is currently blocked:
                  {' '}
                  {exportReadiness.issues.join(' ')}
                </div>
              )}
              <div className="workspace-list">
                {workspace.exports.map((item) => (
                  <div className="workspace-record compact" key={text(item.export_id)}>
                    <div>
                      <strong>{text(item.deliverable_label || item.export_type)}</strong>
                      <span>{text(item.export_id)} · {formatDate(item.created_at)}</span>
                    </div>
                    {Boolean(item.export_url) && (
                      <a href={String(item.export_url)} rel="noreferrer" target="_blank">
                        Open
                      </a>
                    )}
                  </div>
                ))}
                {!workspace.exports.length && <p className="workspace-muted">No exports generated yet.</p>}
              </div>
            </article>
          </section>

          <aside className="workspace-side">
            <section className="workspace-section" id="qa">
              <p className="eyebrow">Quality</p>
              <h2>Approvals and QA</h2>
              <div className="workspace-list">
                {workspace.qualityReviews.map((review) => (
                  <div className="workspace-mini" key={text(review.quality_review_id)}>
                    <strong>{text(review.review_type)}</strong>
                    <span>{review.passed ? 'Passed' : 'Needs review'}</span>
                  </div>
                ))}
                {workspace.decisions.map((decision) => (
                  <div className="workspace-mini" key={text(decision.decision_id)}>
                    <strong>{text(decision.decision_type)}</strong>
                    <span>{shortText(decision.decision_summary, 90)}</span>
                  </div>
                ))}
                {!workspace.qualityReviews.length && !workspace.decisions.length && (
                  <p className="workspace-muted">No QA or decision records yet.</p>
                )}
              </div>
            </section>

            <section className="workspace-section" id="brain">
              <p className="eyebrow">Agency Brain</p>
              <h2>Strategy knowledge coverage</h2>
              <p className="workspace-muted">
                {strategyBrainCount} active global or strategy records are currently wired into strategy prompting.
              </p>
              <p className="workspace-muted">
                Brief intake, kit generation, deliverables, and QA still need explicit runtime wiring before this can
                be treated as full-workflow agency intelligence.
              </p>
              <div className="workspace-list">
                {workspace.agencyBrainStats.slice(0, 8).map((row) => (
                  <div className="workspace-mini" key={`${row.task_key}-${row.knowledge_type}-${row.token_weight}`}>
                    <strong>{text(row.task_key)}</strong>
                    <span>
                      {text(row.count)} {text(row.knowledge_type)} · {text(row.token_weight)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-section">
              <p className="eyebrow">Automation</p>
              <h2>Recent agent runs</h2>
              <div className="workspace-list">
                {workspace.agentRuns.map((run) => (
                  <div className="workspace-mini" key={text(run.agent_run_id)}>
                    <strong>{text(run.action_name)}</strong>
                    <span>{text(run.status)} · {formatDate(run.created_at)}</span>
                  </div>
                ))}
                {!workspace.agentRuns.length && <p className="workspace-muted">No agent runs logged yet.</p>}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}
