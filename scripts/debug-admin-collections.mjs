/* global console */
import { getPayload } from 'payload'

import config from '../src/payload.config.js'

const payload = await getPayload({ config })

const collections = [
  'clients',
  'media',
  'users',
  'brand-briefs',
  'brand-strategies',
  'brand-kits',
  'brand-assets',
  'brand-exports',
  'brand-social-strategies',
  'brand-moodboards',
  'project-memories',
  'research-sources',
  'evidence-items',
  'brand-decisions',
  'quality-reviews',
  'agent-runs',
  'client-feedback-items',
  'agency-knowledge-bases',
]

for (const collection of collections) {
  try {
    const result = await payload.find({
      collection,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    console.log(`OK\t${collection}\t${result.totalDocs}`)
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error)
    console.log(`ERR\t${collection}\t${message}`)
  }
}
