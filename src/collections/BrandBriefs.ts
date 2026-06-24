import type { CollectionConfig } from 'payload';

export const BrandBriefs: CollectionConfig = {
  slug: 'brand-briefs',
  admin: {
    useAsTitle: 'brief_id',
    defaultColumns: ['brief_id', 'client_id', 'status', 'createdAt'],
  },
  fields: [
    { name: 'brief_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'raw_brief', type: 'textarea', required: true },
    { name: 'extracted_brief_json', type: 'json' },
    { name: 'brand_audit_json', type: 'json' },
    { name: 'competitor_analysis_json', type: 'json' },
    { name: 'status', type: 'select', options: ['draft', 'complete'], defaultValue: 'draft' },
  ],
  timestamps: true,
};
