import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { evaluateBrandExportReadiness } from '@/lib/brand/export-readiness'
import { getRoleLabel, ROLE_OPTIONS } from '@/lib/client-assets/roles'
import { getClientWorkspace } from '@/lib/client-workspace/db'
import config from '@/payload.config'

import { ClientReferenceUploadForm } from '../../client-references/[clientId]/ClientReferenceUploadForm'

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
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
const entries = (value: unknown) => Object.entries(asRecord(value)).filter(([, item]) => item !== null && item !== undefined && item !== '')
const titleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const toDisplayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value)) {
    const items = value.map((item) => shortText(item, 160)).filter((item) => item !== 'Not recorded')
    return items.length ? items : null
  }

  if (typeof value === 'object') {
    const objectEntries = entries(value).map(([key, item]) => `${titleCase(key)}: ${shortText(item, 180)}`)
    return objectEntries.length ? objectEntries : null
  }

  return text(value)
}

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
  const briefFields = entries(latestBrief ? asRecord(latestBrief.extracted_brief_json) : {})
  const groupedBriefFields = [
    {
      title: 'Business',
      items: briefFields.filter(([key]) =>
        ['client_name', 'business_name', 'industry', 'location', 'website_url', 'instagram_url', 'email'].includes(key),
      ),
    },
    {
      title: 'Audience and goals',
      items: briefFields.filter(([key]) =>
        ['target_audience', 'offer', 'brand_goals', 'desired_feeling', 'budget', 'timeline', 'source'].includes(key),
      ),
    },
    {
      title: 'Direction and references',
      items: briefFields.filter(([key]) =>
        ['competitors', 'visual_references', 'things_to_avoid', 'origin_lead_id'].includes(key),
      ),
    },
  ].filter((section) => section.items.length > 0)
  const uncategorizedBriefFields = briefFields.filter(
    ([key]) => !groupedBriefFields.some((section) => section.items.some(([sectionKey]) => sectionKey === key)),
  )
  const assetsByRole = new Map<string, number>()

  for (const asset of workspace.assets) {
    const role = text(asset.role, 'image_ref')
    assetsByRole.set(role, (assetsByRole.get(role) || 0) + 1)
  }

  return (
    <main className="workstation-page">
      <section className="workstation-shell">
        <header className="workstation-topbar">
          <div>
            <Link className="workspace-back" href="/clients">
              Back to client list
            </Link>
            <p className="eyebrow">Client workspace</p>
            <h1>{workspace.client.client_name}</h1>
            <p className="workspace-subtitle">
              {workspace.client.client_id} · {workspace.client.status}
            </p>
          </div>
        </header>

        <nav className="workspace-tabs" aria-label="Client workspace sections">
          <a href="#brief">Brief</a>
          <a href="#references">References</a>
          <a href="#strategy">Strategy</a>
          <a href="#directions">Directions</a>
          <a href="#deliverables">Deliverables</a>
          <a href="#qa">QA</a>
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

        <section className="workspace-main workspace-main-full">
            <article className="workspace-section" id="brief">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Intake</p>
                  <h2>Brief</h2>
                </div>
              </div>
              {latestBrief ? (
                <div className="workspace-document">
                  <div className="workspace-document-header">
                    <div>
                      <p className="eyebrow">Client-ready brief</p>
                      <strong>{workspace.client.client_name}</strong>
                    </div>
                    <span>{formatDate(latestBrief.updated_at || latestBrief.created_at)}</span>
                  </div>
                  {groupedBriefFields.length > 0 && (
                    <div className="document-grid">
                      {groupedBriefFields.map((section) => (
                        <section className="document-card" key={section.title}>
                          <h3>{section.title}</h3>
                          <dl className="document-facts">
                            {section.items.map(([key, value]) => {
                              const displayValue = toDisplayValue(value)
                              if (!displayValue) return null

                              return (
                                <div key={key}>
                                  <dt>{titleCase(key)}</dt>
                                  <dd>
                                    {Array.isArray(displayValue) ? (
                                      <ul className="document-list">
                                        {displayValue.map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      displayValue
                                    )}
                                  </dd>
                                </div>
                              )
                            })}
                          </dl>
                        </section>
                      ))}
                    </div>
                  )}
                  {uncategorizedBriefFields.length > 0 && (
                    <section className="document-card">
                      <h3>Additional notes</h3>
                      <dl className="document-facts">
                        {uncategorizedBriefFields.map(([key, value]) => {
                          const displayValue = toDisplayValue(value)
                          if (!displayValue) return null

                          return (
                            <div key={key}>
                              <dt>{titleCase(key)}</dt>
                              <dd>
                                {Array.isArray(displayValue) ? (
                                  <ul className="document-list">
                                    {displayValue.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  displayValue
                                )}
                              </dd>
                            </div>
                          )
                        })}
                      </dl>
                    </section>
                  )}
                  <section className="document-card document-card-full">
                    <h3>Original brief</h3>
                    <p className="document-copy">{text(latestBrief.raw_brief)}</p>
                  </section>
                </div>
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
              </div>
              <div className="reference-grid workspace-embedded-grid">
                <section className="reference-panel">
                  <h2>Upload references</h2>
                  <p>Upload real brand evidence, inspiration, old materials, and product photos directly from this workspace.</p>
                  <ClientReferenceUploadForm clientId={workspace.client.client_id} />
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
              <section className="reference-panel workspace-inline-panel">
                <h2>Saved references</h2>
                {workspace.assets.length ? (
                  <div className="asset-table">
                    {workspace.assets.map((asset) => (
                      <article className="asset-row" key={text(asset.brand_asset_id)}>
                        <div>
                          <strong>{getRoleLabel(text(asset.role, 'image_ref'))}</strong>
                          <span>
                            {text(asset.brand_asset_id)} · {text(asset.asset_type)}
                          </span>
                          <span>{formatDate(asset.created_at)}</span>
                        </div>
                        {Boolean(asset.public_url || asset.file_url) && (
                          <a href={String(asset.public_url || asset.file_url)} rel="noreferrer" target="_blank">
                            Open
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="workspace-muted">No reference assets saved yet.</p>
                )}
              </section>
              {workspace.pendingRequests.length > 0 && (
                <section className="reference-panel workspace-inline-panel">
                  <h2>Pending upload requests</h2>
                  <div className="checklist">
                    {workspace.pendingRequests.map((request) => (
                      <div className="checklist-row" key={text(request.request_id)}>
                        <div>
                          <strong>{getRoleLabel(text(request.role, 'image_ref'))}</strong>
                          <span>{text(request.description, 'Reference requested by the agent.')}</span>
                        </div>
                        <mark className={text(request.priority) === 'required' ? 'missing' : ''}>
                          {text(request.priority)}
                        </mark>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>

            <article className="workspace-section" id="strategy">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Director view</p>
                  <h2>Strategy</h2>
                </div>
              </div>
              {latestStrategy ? (
                <div className="workspace-document">
                  <div className="workspace-document-header">
                    <div>
                      <p className="eyebrow">Client-ready strategy</p>
                      <strong>{workspace.client.client_name}</strong>
                    </div>
                    <span>
                      {text(latestStrategy.status)} · v{text(latestStrategy.version)} ·{' '}
                      {formatDate(latestStrategy.updated_at || latestStrategy.created_at)}
                    </span>
                  </div>
                  <section className="document-card document-card-full">
                    <h3>Positioning</h3>
                    <p className="document-copy">{text(latestStrategy.positioning)}</p>
                  </section>
                  <div className="document-grid">
                    <section className="document-card">
                      <h3>Brand foundation</h3>
                      <dl className="document-facts">
                        <div>
                          <dt>Company summary</dt>
                          <dd>{text(latestStrategy.company_summary)}</dd>
                        </div>
                        <div>
                          <dt>Mission</dt>
                          <dd>{text(latestStrategy.mission)}</dd>
                        </div>
                        <div>
                          <dt>Vision</dt>
                          <dd>{text(latestStrategy.vision)}</dd>
                        </div>
                        <div>
                          <dt>USP</dt>
                          <dd>{text(latestStrategy.unique_selling_prop)}</dd>
                        </div>
                      </dl>
                    </section>
                    <section className="document-card">
                      <h3>Audience and voice</h3>
                      <dl className="document-facts">
                        <div>
                          <dt>Audience profile</dt>
                          <dd>{text(latestStrategy.audience_profile)}</dd>
                        </div>
                        <div>
                          <dt>Brand personality</dt>
                          <dd>{text(latestStrategy.brand_personality)}</dd>
                        </div>
                        <div>
                          <dt>Tone of voice</dt>
                          <dd>{text(latestStrategy.tone_of_voice)}</dd>
                        </div>
                        <div>
                          <dt>Social direction</dt>
                          <dd>{text(latestStrategy.social_media_direction)}</dd>
                        </div>
                      </dl>
                    </section>
                  </div>
                  <section className="document-card document-card-full">
                    <h3>Competitive gap</h3>
                    <p className="document-copy">{text(latestStrategy.competitor_gap)}</p>
                  </section>
                </div>
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
                    <dl className="workspace-facts">
                      <div>
                        <dt>Photography</dt>
                        <dd>{shortText(kit.photography_style, 100)}</dd>
                      </div>
                      <div>
                        <dt>Logo</dt>
                        <dd>{shortText(kit.logo_direction, 100)}</dd>
                      </div>
                    </dl>
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
        </section>
      </section>
    </main>
  )
}
