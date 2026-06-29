import type { CollectionConfig } from 'payload';

export const EvidenceItems: CollectionConfig = {
  slug: 'evidence-items',
  admin: {
    hidden: true,
    useAsTitle: 'evidence_id',
    defaultColumns: ['evidence_id', 'client_id', 'evidence_type', 'confidence', 'status'],
    group: 'Knowledge Engine',
  },
  fields: [
    { name: 'evidence_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brief_id', type: 'text' },
    { name: 'strategy_id', type: 'text' },
    { name: 'source_id', type: 'text' },
    { name: 'evidence_type', type: 'text', defaultValue: 'research_fact' },
    { name: 'claim_text', type: 'textarea', required: true },
    { name: 'evidence_json', type: 'json' },
    { name: 'confidence', type: 'number', defaultValue: 80 },
    { name: 'status', type: 'text', defaultValue: 'active' },
  ],
  timestamps: true,
};
