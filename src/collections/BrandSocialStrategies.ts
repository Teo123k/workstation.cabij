import type { CollectionConfig } from 'payload';

export const BrandSocialStrategies: CollectionConfig = {
  slug: 'brand-social-strategies',
  admin: {
    useAsTitle: 'social_strategy_id',
    defaultColumns: ['social_strategy_id', 'client_id', 'platform', 'version'],
  },
  fields: [
    { name: 'social_strategy_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'platform', type: 'select', options: ['all', 'instagram', 'tiktok', 'linkedin'], defaultValue: 'all' },
    { name: 'strategy_json', type: 'json' },
    { name: 'version', type: 'number', defaultValue: 1 },
  ],
  timestamps: true,
};
