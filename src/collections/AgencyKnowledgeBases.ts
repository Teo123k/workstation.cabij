import type { CollectionConfig } from 'payload'

export const AgencyKnowledgeBases: CollectionConfig = {
  slug: 'agency-knowledge-bases',
  admin: {
    hidden: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'knowledge_type', 'task_key', 'token_weight', 'status', 'version'],
    description:
      'Agency Brain records used for just-in-time prompting. n8n loads these by task instead of relying on hardcoded prompt text.',
    group: 'Knowledge Engine',
  },
  fields: [
    { name: 'knowledge_id', type: 'text', required: true, unique: true },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'knowledge_type',
      type: 'select',
      required: true,
      options: ['skill', 'framework', 'rubric', 'sop', 'template', 'example'],
    },
    {
      name: 'task_key',
      type: 'select',
      required: true,
      options: [
        'global',
        'brand_strategy',
        'brand_kit',
        'social_strategy',
        'marketing_strategy',
        'client_brief',
        'deliverables_export',
        'quality_review',
      ],
    },
    {
      name: 'role_in_prompt',
      type: 'select',
      required: true,
      defaultValue: 'supporting',
      options: ['system', 'framework', 'rubric', 'sop', 'template', 'supporting'],
    },
    { name: 'content_markdown', type: 'textarea', required: true },
    { name: 'summary', type: 'textarea' },
    {
      name: 'token_weight',
      type: 'select',
      required: true,
      defaultValue: 'supporting',
      options: ['core', 'supporting', 'example', 'archive'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ['active', 'draft', 'archived'],
    },
    { name: 'version', type: 'number', required: true, defaultValue: 1 },
    { name: 'source_path', type: 'text' },
    { name: 'source_hash', type: 'text' },
    { name: 'tags_json', type: 'json' },
  ],
  timestamps: true,
}
