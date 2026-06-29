import crypto from 'crypto'

export type ClientIntakeInput = {
  clientId?: string
  clientName: string
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
  owner?: string
  originLeadId?: string
  status?: string
}

const clean = (value: unknown) => String(value || '').trim()

export const makeExternalId = (prefix: string) =>
  `${prefix}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`

export function toClientIntakeRecord(input: ClientIntakeInput) {
  const record = {
    client_name: clean(input.clientName),
    contact_name: clean(input.contactName),
    contact_email: clean(input.contactEmail),
    contact_phone: clean(input.contactPhone),
    website_url: clean(input.websiteUrl),
    instagram_url: clean(input.instagramUrl),
    location: clean(input.location),
    service_summary: clean(input.serviceSummary),
    offers: clean(input.offers),
    target_audience: clean(input.targetAudience),
    brand_goals: clean(input.brandGoals),
    desired_feeling: clean(input.desiredFeeling),
    deliverables: clean(input.deliverables),
    competitors: clean(input.competitors),
    visual_references: clean(input.visualReferences),
    things_to_avoid: clean(input.thingsToAvoid),
    timeline: clean(input.timeline),
    budget: clean(input.budget),
    raw_notes: clean(input.rawNotes),
    owner: clean(input.owner),
    origin_lead_id: clean(input.originLeadId),
  }

  return Object.fromEntries(Object.entries(record).filter(([, value]) => value))
}

export function toRawBrief(input: ClientIntakeInput) {
  const sections: Array<[string, string]> = [
    ['Business name', clean(input.clientName)],
    ['Contact', [clean(input.contactName), clean(input.contactEmail), clean(input.contactPhone)].filter(Boolean).join(' · ')],
    ['Website', clean(input.websiteUrl)],
    ['Instagram', clean(input.instagramUrl)],
    ['Location', clean(input.location)],
    ['What the client sells', clean(input.serviceSummary)],
    ['Offers and services', clean(input.offers)],
    ['Target audience', clean(input.targetAudience)],
    ['Goals', clean(input.brandGoals)],
    ['Desired feeling', clean(input.desiredFeeling)],
    ['Requested deliverables', clean(input.deliverables)],
    ['Competitors or references', clean(input.competitors)],
    ['Visual direction notes', clean(input.visualReferences)],
    ['Things to avoid', clean(input.thingsToAvoid)],
    ['Timeline', clean(input.timeline)],
    ['Budget', clean(input.budget)],
    ['Extra notes', clean(input.rawNotes)],
  ]

  return sections
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n\n')
}

export function toIntakeDefaults(client?: Record<string, unknown> | null, brief?: Record<string, unknown> | null) {
  const extracted =
    brief && brief.extracted_brief_json && typeof brief.extracted_brief_json === 'object' && !Array.isArray(brief.extracted_brief_json)
      ? (brief.extracted_brief_json as Record<string, unknown>)
      : {}

  const read = (key: string) => clean(extracted[key])

  return {
    clientId: clean(client?.client_id),
    clientName: clean(client?.client_name),
    contactName: read('contact_name'),
    contactEmail: read('contact_email'),
    contactPhone: read('contact_phone'),
    websiteUrl: read('website_url'),
    instagramUrl: read('instagram_url'),
    location: read('location'),
    serviceSummary: read('service_summary'),
    offers: read('offers'),
    targetAudience: read('target_audience'),
    brandGoals: read('brand_goals'),
    desiredFeeling: read('desired_feeling'),
    deliverables: read('deliverables'),
    competitors: read('competitors'),
    visualReferences: read('visual_references'),
    thingsToAvoid: read('things_to_avoid'),
    timeline: read('timeline'),
    budget: read('budget'),
    rawNotes: read('raw_notes'),
    originLeadId: clean(client?.origin_lead_id),
    owner: clean(client?.owner),
    status: clean(client?.status) || 'active',
  }
}
