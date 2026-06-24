import type { CollectionConfig } from 'payload';

export const BrandStrategies: CollectionConfig = {
  slug: 'brand-strategies',
  admin: {
    useAsTitle: 'strategy_id',
    defaultColumns: ['strategy_id', 'client_id', 'positioning', 'version', 'status'],
  },
  fields: [
    { name: 'strategy_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brief_id', type: 'text' },
    { name: 'positioning', type: 'textarea' },
    { name: 'audience_profile', type: 'textarea' },
    { name: 'brand_personality', type: 'textarea' },
    { name: 'tone_of_voice', type: 'textarea' },
    { name: 'visual_keywords', type: 'json' },
    { name: 'competitor_gap', type: 'textarea' },
    { name: 'social_media_direction', type: 'textarea' },
    { name: 'strategy_json', type: 'json' },
    { name: 'version', type: 'number', defaultValue: 1 },
    { name: 'parent_strategy_id', type: 'text' },
    { name: 'revision_note', type: 'textarea' },
    { name: 'status', type: 'select', options: ['active', 'superseded'], defaultValue: 'active' },
  ],
  timestamps: true,
};
