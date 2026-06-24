import type { CollectionConfig } from 'payload';

export const BrandExports: CollectionConfig = {
  slug: 'brand-exports',
  admin: {
    useAsTitle: 'export_id',
    defaultColumns: ['export_id', 'client_id', 'export_type', 'createdAt'],
  },
  fields: [
    { name: 'export_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text', required: true },
    { name: 'export_type', type: 'select', options: [
      'brand_board', 'brand_guidelines_pdf', 'social_template_instagram_post',
      'social_template_instagram_story', 'ad_template_meta', 'business_card_mockup',
      'letterhead_mockup', 'email_signature_mockup', 'pitch_slide'
    ]},
    { name: 'export_url', type: 'text' },
    { name: 'export_json', type: 'json' },
  ],
  timestamps: true,
};
