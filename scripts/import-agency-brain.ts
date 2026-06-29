import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { config as loadEnv } from 'dotenv'
import { Pool } from 'pg'

loadEnv()

type KnowledgeType = 'skill' | 'framework' | 'rubric' | 'sop' | 'template' | 'example'
type TaskKey =
  | 'global'
  | 'brand_strategy'
  | 'brand_kit'
  | 'social_strategy'
  | 'marketing_strategy'
  | 'client_brief'
  | 'deliverables_export'
  | 'quality_review'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const agencyBrainRoot = path.resolve(repoRoot, 'Agency Brain')

const folderTypeMap: Record<string, KnowledgeType> = {
  '01 Skills': 'skill',
  '02 Frameworks': 'framework',
  '03 Templates': 'template',
  '04 QA Rubrics': 'rubric',
  '00 Operating System': 'sop',
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferTaskKey(title: string, knowledgeType: KnowledgeType): TaskKey {
  const value = title.toLowerCase()

  if (value.includes('brand strategy') || value.includes('positioning')) return 'brand_strategy'
  if (value.includes('visual identity') || value.includes('creative director')) return 'brand_kit'
  if (value.includes('social')) return 'social_strategy'
  if (
    value.includes('campaign') ||
    value.includes('offer strategy') ||
    value.includes('website copy') ||
    value.includes('ad copy') ||
    value.includes('marketing materials')
  ) {
    return 'marketing_strategy'
  }
  if (value.includes('client delivery')) return 'deliverables_export'
  if (value.includes('review') || value.includes('quality') || knowledgeType === 'rubric') {
    return value.includes('brand strategy') ? 'brand_strategy' : 'quality_review'
  }

  return 'global'
}

function inferRoleInPrompt(knowledgeType: KnowledgeType): string {
  switch (knowledgeType) {
    case 'skill':
      return 'system'
    case 'framework':
      return 'framework'
    case 'rubric':
      return 'rubric'
    case 'sop':
      return 'sop'
    case 'template':
      return 'template'
    default:
      return 'supporting'
  }
}

function inferTokenWeight(title: string, knowledgeType: KnowledgeType): 'core' | 'supporting' | 'example' {
  const value = title.toLowerCase()
  if (
    value.includes('brand strategy director') ||
    value.includes('brand positioning') ||
    value.includes('brand strategy review') ||
    value.includes('quality standard') ||
    value.includes('agency principles')
  ) {
    return 'core'
  }

  return knowledgeType === 'template' ? 'example' : 'supporting'
}

function buildSummary(content: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .slice(0, 4)

  return lines.join(' ').slice(0, 280)
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name)
      if (entry.isDirectory()) return getMarkdownFiles(resolved)
      if (entry.isFile() && /\.md$/i.test(entry.name)) return [resolved]
      return []
    }),
  )

  return files.flat().sort()
}

async function ensureTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agency_knowledge_bases (
      id serial PRIMARY KEY,
      knowledge_id varchar NOT NULL,
      title varchar NOT NULL,
      slug varchar NOT NULL,
      knowledge_type varchar NOT NULL,
      task_key varchar NOT NULL,
      role_in_prompt varchar NOT NULL DEFAULT 'supporting',
      content_markdown text NOT NULL,
      summary text,
      token_weight varchar NOT NULL DEFAULT 'supporting',
      status varchar NOT NULL DEFAULT 'active',
      version numeric NOT NULL DEFAULT 1,
      source_path varchar,
      source_hash varchar,
      tags_json jsonb DEFAULT '[]'::jsonb,
      updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
      created_at timestamp(3) with time zone NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS agency_knowledge_bases_knowledge_id_idx
      ON agency_knowledge_bases (knowledge_id);
    CREATE UNIQUE INDEX IF NOT EXISTS agency_knowledge_bases_slug_idx
      ON agency_knowledge_bases (slug);
    CREATE INDEX IF NOT EXISTS agency_knowledge_bases_task_key_idx
      ON agency_knowledge_bases (task_key, knowledge_type, status);
  `)
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await ensureTable(pool)

    const files = await getMarkdownFiles(agencyBrainRoot)
    let imported = 0

    for (const file of files) {
      const relativePath = path.relative(repoRoot, file)
      const folderName = relativePath.split(path.sep)[1] || ''
      const knowledgeType = folderTypeMap[folderName] || 'sop'
      const raw = await fs.readFile(file, 'utf8')
      const titleMatch = raw.match(/^#\s+(.+)$/m)
      const title = titleMatch?.[1]?.trim() || path.basename(file, '.md')
      const taskKey = inferTaskKey(title, knowledgeType)
      const roleInPrompt = inferRoleInPrompt(knowledgeType)
      const tokenWeight = inferTokenWeight(title, knowledgeType)
      const slug = slugify(relativePath.replace(/\.md$/i, ''))
      const sourceHash = createHash('sha256').update(raw).digest('hex')
      const knowledgeId = `AK${sourceHash.slice(0, 8).toUpperCase()}`
      const tags = [
        knowledgeType,
        taskKey,
        folderName.toLowerCase().replace(/\s+/g, '_'),
      ]

      await pool.query(
        `
          INSERT INTO agency_knowledge_bases (
            knowledge_id, title, slug, knowledge_type, task_key, role_in_prompt,
            content_markdown, summary, token_weight, status, version, source_path, source_hash, tags_json
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, 'active', 1, $10, $11, $12::jsonb
          )
          ON CONFLICT (slug) DO UPDATE SET
            knowledge_id = EXCLUDED.knowledge_id,
            title = EXCLUDED.title,
            knowledge_type = EXCLUDED.knowledge_type,
            task_key = EXCLUDED.task_key,
            role_in_prompt = EXCLUDED.role_in_prompt,
            content_markdown = EXCLUDED.content_markdown,
            summary = EXCLUDED.summary,
            token_weight = EXCLUDED.token_weight,
            source_path = EXCLUDED.source_path,
            source_hash = EXCLUDED.source_hash,
            tags_json = EXCLUDED.tags_json,
            updated_at = now()
        `,
        [
          knowledgeId,
          title,
          slug,
          knowledgeType,
          taskKey,
          roleInPrompt,
          raw,
          buildSummary(raw),
          tokenWeight,
          relativePath,
          sourceHash,
          JSON.stringify(tags),
        ],
      )

      imported += 1
    }

    console.log(`Imported ${imported} Agency Brain records into agency_knowledge_bases`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
