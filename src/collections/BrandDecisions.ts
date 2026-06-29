import type { CollectionConfig } from 'payload';

export const BrandDecisions: CollectionConfig = {
  slug: 'brand-decisions',
  admin: {
    hidden: true,
    useAsTitle: 'decision_id',
    defaultColumns: ['decision_id', 'client_id', 'decision_type', 'status', 'createdAt'],
    group: 'Logs & Diagnostics',
  },
  fields: [
    { name: 'decision_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brief_id', type: 'text' },
    { name: 'strategy_id', type: 'text' },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'decision_type', type: 'text', defaultValue: 'positioning' },
    { name: 'decision_summary', type: 'textarea', required: true },
    { name: 'rationale', type: 'textarea' },
    { name: 'supporting_evidence_ids', type: 'json' },
    { name: 'status', type: 'text', defaultValue: 'active' },
  ],
  timestamps: true,
};
