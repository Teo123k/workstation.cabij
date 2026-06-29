import type { CollectionConfig } from 'payload';
import fs from 'fs';
import path from 'path';

import { getMissingGoogleDriveEnv, uploadFileToGoogleDrive } from '@/lib/client-assets/google-drive'

export const BrandAssets: CollectionConfig = {
  slug: 'brand-assets',
  admin: {
    useAsTitle: 'brand_asset_id',
    defaultColumns: ['brand_asset_id', 'client_id', 'asset_type', 'role', 'status'],
    description:
      'Reference files used by the branding agent. For direct Google Drive upload, open /client-references/[client_id] after logging in.',
  },
  upload: {
    staticDir: 'brand-assets',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // If a file was just uploaded and it doesn't have a file_url yet (meaning it hasn't been pushed to Google Drive)
        if ((operation === 'create' || operation === 'update') && doc.filename && !doc.file_url) {
          try {
            const missingEnv = getMissingGoogleDriveEnv()

            if (missingEnv.length) {
              req.payload.logger.error(`Missing Google Drive env vars: ${missingEnv.join(', ')}`)
              return doc
            }

            const filePath = path.join(process.cwd(), 'brand-assets', doc.filename);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const blob = new Blob([fileBuffer], { type: doc.mimeType });

              // 1. Fetch Client to get provisioned Drive Folder IDs
              let targetFolderId = '';
              try {
                if (doc.client_id) {
                  const clientDocs = await req.payload.find({
                    collection: 'clients',
                    where: { client_id: { equals: doc.client_id } },
                    limit: 1,
                  });
                  if (clientDocs.docs.length > 0) {
                    const client = clientDocs.docs[0];
                    const driveIds = client.drive_folder_ids_json as any;
                    
                    if (driveIds) {
                      const role = doc.role || 'image_ref';
                      if (role === 'food_ref') targetFolderId = driveIds.food || driveIds.root || '';
                      else if (role === 'product_ref') targetFolderId = driveIds.products || driveIds.root || '';
                      else if (role === 'face_ref' || role === 'team_ref' || role === 'founder_ref') targetFolderId = driveIds.team_faces || driveIds.root || '';
                      else if (role === 'pdf_ref' || role === 'material_ref') targetFolderId = driveIds.materials || driveIds.root || '';
                      else if (role === 'competitor_ref') targetFolderId = driveIds.competitors || driveIds.root || '';
                      else if (role === 'moodboard' || role === 'color_board' || role === 'style_ref' || role === 'logo_ref') targetFolderId = driveIds.moodboards || driveIds.root || '';
                      else if (role === 'background_ref' || role === 'location_ref' || role === 'venue_ref') targetFolderId = driveIds.locations || driveIds.root || '';
                      else targetFolderId = driveIds.root || '';
                    }
                  }
                }
              } catch (e) {
                req.payload.logger.error(`Error fetching client for folder ID: ${e}`);
              }

              const driveResult = await uploadFileToGoogleDrive({
                file: new File([blob], doc.filename, { type: doc.mimeType || 'application/octet-stream' }),
                clientId: doc.client_id || '',
                role: doc.role || 'image_ref',
                folderId: targetFolderId || undefined,
              });

              await req.payload.update({
                collection: 'brand-assets',
                id: doc.id,
                data: {
                  file_url: driveResult.webViewLink || driveResult.webContentLink || '',
                  public_url: driveResult.webViewLink || driveResult.webContentLink || '',
                  metadata_json: {
                    ...(doc.metadata_json || {}),
                    storage: 'google_drive',
                    google_drive_file_id: driveResult.id,
                    google_drive_name: driveResult.name || doc.filename,
                    google_drive_web_view_link: driveResult.webViewLink || '',
                    google_drive_web_content_link: driveResult.webContentLink || '',
                    uploaded_from: 'payload_admin_brand_assets',
                  },
                },
              });
            }
          } catch (error) {
            req.payload.logger.error(`Error in Google Drive upload hook: ${error}`);
          }
        }
        return doc;
      }
    ]
  },
  fields: [
    { name: 'brand_asset_id', type: 'text', unique: true },
    { name: 'client_id', type: 'text', required: true },
    { name: 'brand_kit_id', type: 'text' },
    { name: 'asset_type', type: 'text', defaultValue: 'image/jpeg' },
    { name: 'role', type: 'select', options: [
      'logo_ref', 'moodboard', 'color_board', 'image_ref', 'face_ref',
      'background_ref', 'style_ref', 'competitor_ref', 'pdf_ref'
    ]},
    { name: 'file_url', type: 'text' },
    { name: 'public_url', type: 'text' },
    { name: 'frameio_asset_id', type: 'text' },
    { name: 'metadata_json', type: 'json' },
    { name: 'reference_notes', type: 'textarea' },
    { name: 'reference_tags_json', type: 'json' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active' },
  ],
  timestamps: true,
};
