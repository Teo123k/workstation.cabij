import type { CollectionConfig } from 'payload';

export const BrandAssets: CollectionConfig = {
  slug: 'brand-assets',
  admin: {
    useAsTitle: 'brand_asset_id',
    defaultColumns: ['brand_asset_id', 'client_id', 'asset_type', 'role', 'status'],
  },
  fields: [
    { name: 'brand_asset_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'asset_type', type: 'text', required: true },
    { name: 'role', type: 'select', options: [
      'logo_ref', 'moodboard', 'color_board', 'image_ref', 'face_ref',
      'background_ref', 'style_ref', 'competitor_ref', 'pdf_ref'
    ]},
    { name: 'file_url', type: 'text' },
    { name: 'public_url', type: 'text' },
    { name: 'frameio_asset_id', type: 'text' },
    { name: 'metadata_json', type: 'json' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active' },
  ],
  timestamps: true,
};
