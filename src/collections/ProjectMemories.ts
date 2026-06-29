import type { CollectionConfig } from 'payload';

export const ProjectMemories: CollectionConfig = {
  slug: 'project-memories',
  admin: {
    hidden: true,
    useAsTitle: 'memory_key',
    defaultColumns: ['memory_key', 'client_id', 'source_type', 'confidence', 'status'],
    group: 'Knowledge Engine',
  },
  fields: [
    { name: 'memory_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'memory_key', type: 'text', required: true },
    { name: 'memory_value_json', type: 'json' },
    { name: 'source_type', type: 'text', defaultValue: 'manual' },
    { name: 'source_ref', type: 'text' },
    { name: 'confidence', type: 'number', defaultValue: 80 },
    { name: 'status', type: 'text', defaultValue: 'active' },
    { name: 'created_by', type: 'text', defaultValue: 'system' },
  ],
  timestamps: true,
};
