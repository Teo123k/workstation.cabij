'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

import { ROLE_OPTIONS } from '@/lib/client-assets/roles'

type UploadState =
  | { status: 'idle'; message: string }
  | { status: 'uploading'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export function ClientReferenceUploadForm({ clientId }: { clientId: string }) {
  const [state, setState] = useState<UploadState>({ status: 'idle', message: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = new FormData(form)

    body.set('client_id', clientId)
    setState({ status: 'uploading', message: 'Uploading to Google Drive...' })

    const response = await fetch('/api/client-assets/upload', {
      method: 'POST',
      body,
    })
    const json = (await response.json().catch(() => ({}))) as {
      uploaded?: Array<{ brand_asset_id?: string }>
      error?: string
      details?: string
      missing_env?: string[]
    }

    if (!response.ok) {
      const detail = json.details ? ` ${json.details}` : ''
      setState({ status: 'error', message: `${json.error || 'Upload failed.'}${detail}` })
      return
    }

    setState({
      status: 'success',
      message: `Saved ${json.uploaded?.length || 0} reference file(s). Refreshing...`,
    })
    window.setTimeout(() => window.location.reload(), 900)
  }

  return (
    <form className="reference-upload" onSubmit={handleSubmit}>
      <label>
        Reference type
        <select name="role" required>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Files
        <input multiple name="files" required type="file" />
      </label>

      <label>
        Notes for the agent
        <textarea
          name="reference_notes"
          placeholder="Example: preferred plating style, old menu, competitor screenshot, avoid this look..."
          rows={4}
        />
      </label>

      <button disabled={state.status === 'uploading'} type="submit">
        {state.status === 'uploading' ? 'Uploading...' : 'Upload to Google Drive'}
      </button>

      {state.message && <p className={`upload-message ${state.status}`}>{state.message}</p>}
    </form>
  )
}
