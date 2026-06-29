import type { CollectionConfig } from 'payload';

export const QualityReviews: CollectionConfig = {
  slug: 'quality-reviews',
  admin: {
    hidden: true,
    useAsTitle: 'quality_review_id',
    defaultColumns: ['quality_review_id', 'client_id', 'review_type', 'passed', 'createdAt'],
    group: 'Logs & Diagnostics',
  },
  fields: [
    { name: 'quality_review_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brief_id', type: 'text' },
    { name: 'strategy_id', type: 'text' },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'export_id', type: 'text' },
    { name: 'review_type', type: 'text', defaultValue: 'deliverable' },
    { name: 'review_summary', type: 'textarea' },
    { name: 'score_json', type: 'json' },
    { name: 'warnings_json', type: 'json' },
    { name: 'errors_json', type: 'json' },
    { name: 'evidence_item_ids', type: 'json' },
    { name: 'brand_decision_ids', type: 'json' },
    { name: 'passed', type: 'checkbox', defaultValue: false },
    { name: 'reviewed_by', type: 'text', defaultValue: 'system' },
  ],
  timestamps: true,
};
