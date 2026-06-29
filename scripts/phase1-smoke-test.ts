import 'dotenv/config'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const testIds = {
  clientId: 'CPHASE1',
  memoryId: 'PMPHASE1',
  sourceId: 'RSPHASE1',
  evidenceId: 'EVPHASE1',
  decisionId: 'BDPHASE1',
  reviewId: 'QRPHASE1',
  runId: 'ARPHASE1',
  feedbackId: 'CFPHASE1',
}

const client = new Client({ connectionString: databaseUrl })

const requireRow = (label: string, rowCount: number | null) => {
  if ((rowCount ?? 0) < 1) {
    throw new Error(`${label} verification failed`)
  }
}

async function main() {
  await client.connect()
  await client.query('BEGIN')

  try {
    await client.query(
      `
        INSERT INTO client (client_id, client_name, origin_lead_id, owner, status)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [testIds.clientId, 'Phase 1 Smoke Client', 'phase1-smoke', 'codex', 'inactive'],
    )

    await client.query(
      `
        INSERT INTO project_memory (memory_id, client_id, memory_key, memory_value_json, source_type, source_ref)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      `,
      [
        testIds.memoryId,
        testIds.clientId,
        'brand_summary',
        JSON.stringify({ summary: 'Premium private dining brand' }),
        'manual',
        'phase1-smoke',
      ],
    )

    await client.query(
      `
        INSERT INTO research_source (source_id, client_id, title, url, source_type, snippet, source_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        testIds.sourceId,
        testIds.clientId,
        'Competitor homepage',
        'https://example.com/competitor',
        'website',
        'Luxury private dining positioning',
        JSON.stringify({ provider: 'manual', note: 'phase1 smoke source' }),
      ],
    )

    await client.query(
      `
        INSERT INTO evidence_item (evidence_id, client_id, source_id, evidence_type, claim_text, evidence_json)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        testIds.evidenceId,
        testIds.clientId,
        testIds.sourceId,
        'research_fact',
        'Competitors emphasize exclusivity and chef-led storytelling.',
        JSON.stringify({ confidence_reason: 'manual smoke test' }),
      ],
    )

    await client.query(
      `
        INSERT INTO brand_decision (decision_id, client_id, decision_type, decision_summary, rationale, supporting_evidence_ids)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        testIds.decisionId,
        testIds.clientId,
        'positioning',
        'Lean into private-chef exclusivity.',
        'Supported by competitor research and premium positioning.',
        JSON.stringify([testIds.evidenceId]),
      ],
    )

    await client.query(
      `
        INSERT INTO quality_review (quality_review_id, client_id, review_type, review_summary, score_json, warnings_json, errors_json, evidence_item_ids, brand_decision_ids, passed)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10)
      `,
      [
        testIds.reviewId,
        testIds.clientId,
        'deliverable',
        'Phase 1 smoke review.',
        JSON.stringify({ evidence_support: 8, client_readiness: 'warn' }),
        JSON.stringify(['Needs full Tavily evidence before production']),
        JSON.stringify([]),
        JSON.stringify([testIds.evidenceId]),
        JSON.stringify([testIds.decisionId]),
        false,
      ],
    )

    await client.query(
      `
        INSERT INTO agent_run (agent_run_id, client_id, run_type, action_name, model_name, tool_name, input_json, output_json, status, started_at, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, now(), now())
      `,
      [
        testIds.runId,
        testIds.clientId,
        'workflow',
        'phase1_smoke_test',
        'manual',
        'pg',
        JSON.stringify({ sourceId: testIds.sourceId }),
        JSON.stringify({ evidenceId: testIds.evidenceId }),
        'completed',
      ],
    )

    await client.query(
      `
        INSERT INTO client_feedback_item (feedback_id, client_id, source_type, feedback_text, feedback_json, status, created_by)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      `,
      [
        testIds.feedbackId,
        testIds.clientId,
        'client',
        'Need more premium tone in the summary.',
        JSON.stringify({ severity: 'normal' }),
        'new',
        'client',
      ],
    )

    const checks = await Promise.all([
      client.query('SELECT 1 FROM project_memories WHERE memory_id = $1', [testIds.memoryId]),
      client.query('SELECT 1 FROM research_sources WHERE source_id = $1', [testIds.sourceId]),
      client.query('SELECT 1 FROM evidence_items WHERE evidence_id = $1', [testIds.evidenceId]),
      client.query('SELECT 1 FROM brand_decisions WHERE decision_id = $1', [testIds.decisionId]),
      client.query('SELECT 1 FROM quality_reviews WHERE quality_review_id = $1', [testIds.reviewId]),
      client.query('SELECT 1 FROM agent_runs WHERE agent_run_id = $1', [testIds.runId]),
      client.query('SELECT 1 FROM client_feedback_items WHERE feedback_id = $1', [testIds.feedbackId]),
    ])

    requireRow('project_memories', checks[0].rowCount)
    requireRow('research_sources', checks[1].rowCount)
    requireRow('evidence_items', checks[2].rowCount)
    requireRow('brand_decisions', checks[3].rowCount)
    requireRow('quality_reviews', checks[4].rowCount)
    requireRow('agent_runs', checks[5].rowCount)
    requireRow('client_feedback_items', checks[6].rowCount)

    console.log(
      JSON.stringify(
        {
          ok: true,
          verified: [
            'project_memory <-> project_memories',
            'research_source <-> research_sources',
            'evidence_item <-> evidence_items',
            'brand_decision <-> brand_decisions',
            'quality_review <-> quality_reviews',
            'agent_run <-> agent_runs',
            'client_feedback_item <-> client_feedback_items',
          ],
        },
        null,
        2,
      ),
    )
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error))

  try {
    await client.query('ROLLBACK')
  } catch {}

  try {
    await client.end()
  } catch {}

  process.exit(1)
})
