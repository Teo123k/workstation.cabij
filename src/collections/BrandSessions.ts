import { CollectionConfig } from 'payload'

export const BrandSessions: CollectionConfig = {
  slug: 'brandSessions',
  admin: {
    useAsTitle: 'telegram_chat_id',
    group: 'Branding OS',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'telegram_chat_id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'client_id',
      type: 'relationship',
      relationTo: 'clients',
      required: false,
    },
    {
      name: 'current_action',
      type: 'text',
      required: false,
    },
    {
      name: 'current_stage',
      type: 'text',
      required: false,
    },
    {
      name: 'session_json',
      type: 'json',
      required: false,
    }
  ],
  timestamps: true,
}
