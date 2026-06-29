import { headers as getHeaders } from 'next/headers.js'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { makeExternalId, toClientIntakeRecord, toRawBrief, type ClientIntakeInput } from '@/lib/client-intake/brief'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

async function requirePayloadUser() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return { payload, user }
}

export async function POST(request: Request) {
  const { payload, user } = await requirePayloadUser()

  if (!user) {
    return NextResponse.json({ error: 'Payload admin login required' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<ClientIntakeInput>
  const clientName = String(body.clientName || '').trim()

  if (!clientName) {
    return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
  }

  const input: ClientIntakeInput = {
    ...body,
    clientName,
    owner: String(body.owner || user.email || '').trim(),
    status: String(body.status || 'active').trim() || 'active',
  }

  const clientRecord = toClientIntakeRecord(input)
  const rawBrief = toRawBrief(input)
  const extractedBrief = clientRecord
  const desiredClientId = String(body.clientId || '').trim()

  const existingClient =
    desiredClientId
      ? (
          await payload.find({
            collection: 'clients',
            where: { client_id: { equals: desiredClientId } },
            limit: 1,
          })
        ).docs[0]
      : undefined

  const createdOrUpdatedClient = existingClient
    ? await payload.update({
        collection: 'clients',
        id: existingClient.id,
        data: {
          client_name: clientName,
          owner: input.owner,
          status: input.status === 'inactive' ? 'inactive' : 'active',
          origin_lead_id: input.originLeadId || undefined,
        },
      })
    : await payload.create({
        collection: 'clients',
        data: {
          client_id: desiredClientId || makeExternalId('CF'),
          client_name: clientName,
          owner: input.owner,
          status: input.status === 'inactive' ? 'inactive' : 'active',
          origin_lead_id: input.originLeadId || undefined,
        },
      })

  const briefSearch = await payload.find({
    collection: 'brand-briefs',
    where: { client_id: { equals: createdOrUpdatedClient.client_id } },
    sort: '-updatedAt',
    limit: 1,
  })

  const existingBrief = briefSearch.docs[0]

  const briefDoc = existingBrief
    ? await payload.update({
        collection: 'brand-briefs',
        id: existingBrief.id,
        data: {
          raw_brief: rawBrief,
          extracted_brief_json: extractedBrief,
          status: 'complete',
        },
      })
    : await payload.create({
        collection: 'brand-briefs',
        data: {
          brief_id: makeExternalId('BRF'),
          client_id: createdOrUpdatedClient.client_id,
          raw_brief: rawBrief,
          extracted_brief_json: extractedBrief,
          status: 'complete',
        },
      })

  return NextResponse.json({
    client_id: createdOrUpdatedClient.client_id,
    client_name: createdOrUpdatedClient.client_name,
    brief_id: briefDoc.brief_id,
    workspace_url: `/clients/${createdOrUpdatedClient.client_id}`,
    references_url: `/client-references/${createdOrUpdatedClient.client_id}`,
  })
}
