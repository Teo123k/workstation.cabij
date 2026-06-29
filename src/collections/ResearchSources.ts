import type { CollectionConfig } from 'payload';

export const ResearchSources: CollectionConfig = {
  slug: 'research-sources',
  admin: {
    hidden: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'client_id', 'source_type', 'status', 'createdAt'],
    group: 'Knowledge Engine',
  },
  fields: [
    { name: 'source_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'title', type: 'text' },
    { name: 'url', type: 'text' },
    { name: 'source_type', type: 'text', defaultValue: 'website' },
    { name: 'snippet', type: 'textarea' },
    { name: 'source_json', type: 'json' },
    { name: 'status', type: 'text', defaultValue: 'active' },
    { name: 'created_by', type: 'text', defaultValue: 'system' },
  ],
  timestamps: true,
};
