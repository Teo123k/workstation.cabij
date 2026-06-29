import type { CollectionConfig } from 'payload';

export const ClientFeedbackItems: CollectionConfig = {
  slug: 'client-feedback-items',
  admin: {
    hidden: true,
    useAsTitle: 'feedback_id',
    defaultColumns: ['feedback_id', 'client_id', 'source_type', 'status', 'createdAt'],
    group: 'Logs & Diagnostics',
  },
  fields: [
    { name: 'feedback_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'strategy_id', type: 'text' },
    { name: 'export_id', type: 'text' },
    { name: 'source_type', type: 'text', defaultValue: 'client' },
    { name: 'feedback_text', type: 'textarea', required: true },
    { name: 'feedback_json', type: 'json' },
    { name: 'status', type: 'text', defaultValue: 'new' },
    { name: 'created_by', type: 'text', defaultValue: 'client' },
  ],
  timestamps: true,
};
