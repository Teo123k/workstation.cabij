import type { CollectionConfig } from 'payload';

const clientScopedLegacyTables = [
  'client_feedback_item',
  'agent_run',
  'quality_review',
  'brand_decision',
  'evidence_item',
  'brand_image_request',
  'brand_moodboard',
  'brand_export',
  'brand_social_strategy',
  'brand_asset',
  'brand_kit',
  'brand_strategy',
  'brand_brief',
  'project_memory',
  'research_source',
  'brand_revision_log',
  'client_review_token',
  'brand_session',
] as const;

const clientScopedPayloadTables = [
  'client_feedback_items',
  'agent_runs',
  'quality_reviews',
  'brand_decisions',
  'evidence_items',
  'brand_moodboards',
  'brand_exports',
  'brand_social_strategies',
  'brand_assets',
  'brand_kits',
  'brand_strategies',
  'brand_briefs',
  'project_memories',
  'research_sources',
] as const;

const sqlLiteral = (value: unknown) => String(value).replace(/'/g, "''");

const isMissingTableOrColumn = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('does not exist') ||
    message.includes('column "client_id"') ||
    message.includes('relation "') ||
    message.includes('undefined_table') ||
    message.includes('undefined_column')
  );
};

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'client_name',
    defaultColumns: ['client_id', 'client_name', 'status', 'createdAt'],
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        try {
          if (!req.payload.db.drizzle) return;

          const numericId = Number(id);
          if (!Number.isFinite(numericId)) return;

          // Get the custom string client_id for this internal database ID
          const res = await req.payload.db.drizzle.execute(
            `SELECT "client_id" FROM "clients" WHERE "id" = ${numericId}`
          );

          if (!res.rows || res.rows.length === 0) return;
          const cId = res.rows[0].client_id;
          if (!cId) return;

          const clientId = sqlLiteral(cId);

          // Delete children first so the clients -> client sync trigger can remove the source row.
          for (const table of clientScopedLegacyTables) {
            try {
              await req.payload.db.drizzle.execute(
                `DELETE FROM "${table}" WHERE "client_id" = '${clientId}'`
              );
            } catch (error) {
              if (!isMissingTableOrColumn(error)) throw error;
            }
          }

          for (const table of clientScopedPayloadTables) {
            try {
              await req.payload.db.drizzle.execute(
                `DELETE FROM "${table}" WHERE "client_id" = '${clientId}'`
              );
            } catch (error) {
              if (!isMissingTableOrColumn(error)) throw error;
            }
          }
        } catch(e) {
          req.payload.logger.error("Failed to cleanup legacy client via Drizzle: " + e);
          throw e;
        }
      }
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          try {
            const webhookUrl = 'https://n8n-vwzv.srv1756298.hstgr.cloud/webhook/provision-client-folders';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                client_id: doc.client_id,
                client_name: doc.client_name
              }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
          } catch (e) {
            req.payload.logger.error(`Provision webhook triggered but connection closed early: ${e}`);
          }
        }
        return doc;
      }
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Trigger n8n teardown after the database cleanup has already happened in beforeDelete.
        try {
          const webhookUrl = 'https://n8n-vwzv.srv1756298.hstgr.cloud/webhook/teardown-client';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: doc.client_id,
              client_name: doc.client_name,
              drive_folder_ids_json: doc.drive_folder_ids_json
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (e) {
          req.payload.logger.error(`Teardown webhook triggered but connection closed early (expected for async teardowns): ${e}`);
        }
      }
    ]
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Workspace',
          fields: [
            {
              name: 'workspace_ui',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/ClientWorkspace#ClientWorkspace',
                },
              },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            { name: 'client_id', type: 'text', required: true, unique: true },
            { name: 'client_name', type: 'text', required: true },
            { name: 'origin_lead_id', type: 'text' },
            { name: 'owner', type: 'text' },
            { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active' },
            { name: 'drive_folder_ids_json', type: 'json' },
          ],
        },
      ],
    },
  ],
  timestamps: true,
};
