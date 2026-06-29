import type { CollectionConfig } from 'payload';

export const BrandMoodboards: CollectionConfig = {
  slug: 'brand-moodboards',
  admin: {
    useAsTitle: 'moodboard_id',
    defaultColumns: ['moodboard_id', 'client_id', 'board_type', 'status', 'createdAt'],
  },
  fields: [
    { name: 'moodboard_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text', required: true },
    { name: 'board_type', type: 'text', required: true },
    { name: 'prompt_used', type: 'textarea' },
    { name: 'reference_asset_ids', type: 'json' },
    { name: 'image_url', type: 'text' },
    { name: 'public_url', type: 'text' },
    { name: 'generation_model', type: 'text', defaultValue: 'gpt-image-2' },
    { name: 'metadata_json', type: 'json' },
    { name: 'status', type: 'select', options: ['draft', 'approved', 'superseded'], defaultValue: 'draft' },
  ],
  timestamps: true,
};
