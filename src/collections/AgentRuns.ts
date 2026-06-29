import type { CollectionConfig } from 'payload';

export const AgentRuns: CollectionConfig = {
  slug: 'agent-runs',
  admin: {
    hidden: true,
    useAsTitle: 'action_name',
    defaultColumns: ['action_name', 'client_id', 'run_type', 'status', 'createdAt'],
    group: 'Logs & Diagnostics',
  },
  fields: [
    { name: 'agent_run_id', type: 'text', required: true, unique: true },
    { name: 'client_id', type: 'text' },
    { name: 'brief_id', type: 'text' },
    { name: 'strategy_id', type: 'text' },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'export_id', type: 'text' },
    { name: 'run_type', type: 'text', defaultValue: 'workflow' },
    { name: 'action_name', type: 'text', required: true },
    { name: 'model_name', type: 'text' },
    { name: 'tool_name', type: 'text' },
    { name: 'input_json', type: 'json' },
    { name: 'output_json', type: 'json' },
    { name: 'status', type: 'text', defaultValue: 'completed' },
    { name: 'error_text', type: 'textarea' },
    { name: 'started_at', type: 'date' },
    { name: 'completed_at', type: 'date' },
  ],
  timestamps: true,
};
