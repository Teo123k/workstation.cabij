import type { CollectionConfig } from 'payload';

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'client_name',
    defaultColumns: ['client_name', 'client_id', 'status', 'createdAt'],
  },
  fields: [
    { name: 'client_id', type: 'text', required: true, unique: true },
    { name: 'client_name', type: 'text', required: true },
    { name: 'origin_lead_id', type: 'text' },
    { name: 'owner', type: 'text' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active' },
  ],
  timestamps: true,
};
