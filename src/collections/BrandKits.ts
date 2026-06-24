import type { CollectionConfig } from 'payload';

export const BrandKits: CollectionConfig = {
  slug: 'brand-kits',
  admin: {
    useAsTitle: 'direction_name',
    defaultColumns: ['direction_name', 'client_id', 'status', 'version', 'approved_at'],
  },
  fields: [
    { name: 'brand_kit_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'strategy_id', type: 'text' },
    { name: 'status', type: 'select', options: ['draft', 'approved', 'superseded'], defaultValue: 'draft' },
    { name: 'direction_name', type: 'text', required: true },
    { name: 'colors_json', type: 'json' },
    { name: 'typography_json', type: 'json' },
    { name: 'logo_direction', type: 'textarea' },
    { name: 'photography_style', type: 'textarea' },
    { name: 'social_media_vibe', type: 'textarea' },
    { name: 'instagram_grid_style', type: 'textarea' },
    { name: 'ad_content_style', type: 'textarea' },
    { name: 'content_rules_json', type: 'json' },
    { name: 'full_brand_kit_json', type: 'json' },
    { name: 'version', type: 'number', defaultValue: 1 },
    { name: 'parent_kit_id', type: 'text' },
    { name: 'revision_note', type: 'textarea' },
    { name: 'client_feedback', type: 'textarea' },
    { name: 'approved_at', type: 'date' },
  ],
  timestamps: true,
};
