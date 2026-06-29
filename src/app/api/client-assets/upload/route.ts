import { headers as getHeaders } from 'next/headers.js'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { normalizeBrandAssetRole } from '@/lib/client-assets/roles'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

const DEFAULT_N8N_UPLOAD_WEBHOOK_URL =
  'https://n8n-vwzv.srv1756298.hstgr.cloud/webhook/payloadRefUpload01/webhook/payload-reference-upload'

async function requirePayloadUser() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return user
}

export async function POST(request: Request) {
  const user = await requirePayloadUser()

  if (!user) {
    return NextResponse.json({ error: 'Payload admin login required' }, { status: 401 })
  }

  const formData = await request.formData()
  const clientId = String(formData.get('client_id') || '').trim()
  const role = normalizeBrandAssetRole(String(formData.get('role') || 'image_ref'))
  const referenceNotes = String(formData.get('reference_notes') || '').trim()
  const files = formData.getAll('files').filter((file): file is File => file instanceof File)
  const uploadUrl = process.env.N8N_PAYLOAD_UPLOAD_WEBHOOK_URL || DEFAULT_N8N_UPLOAD_WEBHOOK_URL

  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }

  if (!files.length) {
    return NextResponse.json({ error: 'At least one file is required' }, { status: 400 })
  }

  const uploaded = []

  for (const file of files) {
    const requestUrl = new URL(uploadUrl)

    requestUrl.searchParams.set('client_id', clientId)
    requestUrl.searchParams.set('role', role)
    requestUrl.searchParams.set('filename', file.name || `${role}-${Date.now()}`)
    requestUrl.searchParams.set('reference_notes', referenceNotes)
    requestUrl.searchParams.set('uploaded_by', user.email || 'payload_admin')

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'content-type': file.type || 'application/octet-stream',
      },
      body: Buffer.from(await file.arrayBuffer()),
    })

    const json = (await response.json().catch(() => ({}))) as {
      brand_asset_id?: string
      client_id?: string
      role?: string
      file_url?: string
      public_url?: string
      error?: string
      message?: string
    }

    if (!response.ok || !json.brand_asset_id) {
      return NextResponse.json(
        {
          error: 'n8n upload bridge failed',
          details: json.error || json.message || response.statusText,
          file: file.name,
        },
        { status: 502 },
      )
    }

    uploaded.push(json)
  }

  return NextResponse.json({ uploaded })
}
