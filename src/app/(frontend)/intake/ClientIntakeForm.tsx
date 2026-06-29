'use client'

import type { FormEvent } from 'react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type IntakeDefaults = {
  clientId?: string
  clientName?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
  instagramUrl?: string
  location?: string
  serviceSummary?: string
  offers?: string
  targetAudience?: string
  brandGoals?: string
  desiredFeeling?: string
  deliverables?: string
  competitors?: string
  visualReferences?: string
  thingsToAvoid?: string
  timeline?: string
  budget?: string
  rawNotes?: string
  originLeadId?: string
  owner?: string
  status?: string
}

type SubmitState =
  | { status: 'idle'; message: string }
  | { status: 'saving'; message: string }
  | { status: 'success'; message: string; clientId: string; workspaceUrl: string; referencesUrl: string }
  | { status: 'error'; message: string }

export function ClientIntakeForm({
  defaults,
  mode,
}: {
  defaults?: IntakeDefaults
  mode: 'create' | 'edit'
}) {
  const [state, setState] = useState<SubmitState>({ status: 'idle', message: '' })
  const submitLabel = useMemo(
    () => (mode === 'edit' ? 'Save intake update' : 'Create client project'),
    [mode],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const body = Object.fromEntries(formData.entries())

    setState({ status: 'saving', message: mode === 'edit' ? 'Saving intake...' : 'Creating project...' })

    const response = await fetch('/api/client-intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await response.json().catch(() => ({}))) as {
      client_id?: string
      workspace_url?: string
      references_url?: string
      error?: string
    }

    if (!response.ok || !json.client_id || !json.workspace_url || !json.references_url) {
      setState({ status: 'error', message: json.error || 'Could not save the intake.' })
      return
    }

    setState({
      status: 'success',
      message:
        mode === 'edit'
          ? 'Intake updated. The client workspace and references are ready.'
          : 'Project created. Continue by uploading references or reviewing the workspace.',
      clientId: json.client_id,
      workspaceUrl: json.workspace_url,
      referencesUrl: json.references_url,
    })
  }

  return (
    <form className="intake-form" onSubmit={handleSubmit}>
      {defaults?.clientId && <input defaultValue={defaults.clientId} name="clientId" type="hidden" />}

      <div className="intake-grid">
        <label>
          Client or business name
          <input defaultValue={defaults?.clientName} name="clientName" required type="text" />
        </label>

        <label>
          Owner or account lead
          <input defaultValue={defaults?.owner} name="owner" type="text" />
        </label>

        <label>
          Contact name
          <input defaultValue={defaults?.contactName} name="contactName" type="text" />
        </label>

        <label>
          Contact email
          <input defaultValue={defaults?.contactEmail} name="contactEmail" type="email" />
        </label>

        <label>
          Contact phone
          <input defaultValue={defaults?.contactPhone} name="contactPhone" type="text" />
        </label>

        <label>
          Lead or request ID
          <input defaultValue={defaults?.originLeadId} name="originLeadId" type="text" />
        </label>

        <label>
          Website
          <input defaultValue={defaults?.websiteUrl} name="websiteUrl" type="url" />
        </label>

        <label>
          Instagram or social URL
          <input defaultValue={defaults?.instagramUrl} name="instagramUrl" type="url" />
        </label>

        <label>
          Location
          <input defaultValue={defaults?.location} name="location" type="text" />
        </label>

        <label>
          Project status
          <select defaultValue={defaults?.status || 'active'} name="status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <label>
        What the client sells or delivers
        <textarea
          defaultValue={defaults?.serviceSummary}
          name="serviceSummary"
          placeholder="Describe the service, product, experience, or offer clearly."
          required
          rows={4}
        />
      </label>

      <label>
        Main offers or packages
        <textarea
          defaultValue={defaults?.offers}
          name="offers"
          placeholder="Example: private dining, retreat catering, premium event service, tasting menus."
          rows={4}
        />
      </label>

      <div className="intake-grid">
        <label>
          Target audience
          <textarea
            defaultValue={defaults?.targetAudience}
            name="targetAudience"
            placeholder="Who is the client trying to attract?"
            rows={4}
          />
        </label>

        <label>
          Brand goals
          <textarea
            defaultValue={defaults?.brandGoals}
            name="brandGoals"
            placeholder="Bookings, repositioning, premium perception, launch support, social growth."
            rows={4}
          />
        </label>
      </div>

      <div className="intake-grid">
        <label>
          Desired feeling or tone
          <textarea
            defaultValue={defaults?.desiredFeeling}
            name="desiredFeeling"
            placeholder="How should the brand feel to the audience?"
            rows={4}
          />
        </label>

        <label>
          Requested deliverables
          <textarea
            defaultValue={defaults?.deliverables}
            name="deliverables"
            placeholder="Brand strategy, social direction, launch visuals, campaign ideas, deck, board, etc."
            rows={4}
          />
        </label>
      </div>

      <div className="intake-grid">
        <label>
          Competitors or market references
          <textarea
            defaultValue={defaults?.competitors}
            name="competitors"
            placeholder="List competitors, reference brands, or market comparisons."
            rows={4}
          />
        </label>

        <label>
          Visual references or style notes
          <textarea
            defaultValue={defaults?.visualReferences}
            name="visualReferences"
            placeholder="What should the work visually lean toward or away from?"
            rows={4}
          />
        </label>
      </div>

      <div className="intake-grid">
        <label>
          Things to avoid
          <textarea
            defaultValue={defaults?.thingsToAvoid}
            name="thingsToAvoid"
            placeholder="Visual clichés, wrong audience cues, bad references, overused styles."
            rows={4}
          />
        </label>

        <label>
          Extra notes
          <textarea
            defaultValue={defaults?.rawNotes}
            name="rawNotes"
            placeholder="Anything the strategy or design team should know before starting."
            rows={4}
          />
        </label>
      </div>

      <div className="intake-grid">
        <label>
          Timeline
          <input defaultValue={defaults?.timeline} name="timeline" type="text" />
        </label>

        <label>
          Budget
          <input defaultValue={defaults?.budget} name="budget" type="text" />
        </label>
      </div>

      <button disabled={state.status === 'saving'} type="submit">
        {state.status === 'saving' ? 'Saving...' : submitLabel}
      </button>

      {state.message && state.status !== 'success' && (
        <p className={`upload-message ${state.status === 'error' ? 'error' : 'success'}`}>{state.message}</p>
      )}

      {state.status === 'success' && (
        <div className="intake-success">
          <p className="upload-message success">{state.message}</p>
          <div className="intake-actions">
            <Link className="reference-button" href={state.workspaceUrl}>
              Open workspace
            </Link>
            <Link className="reference-button secondary" href={state.referencesUrl}>
              Upload references
            </Link>
          </div>
          <p className="reference-muted">
            Client ID: <code>{state.clientId}</code>
          </p>
        </div>
      )}
    </form>
  )
}
