import { headers as getHeaders } from 'next/headers.js'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { createClientReferenceAsset } from '@/lib/client-assets/db'
import { getMissingGoogleDriveEnv, uploadFileToGoogleDrive } from '@/lib/client-assets/google-drive'
import { normalizeBrandAssetRole } from '@/lib/client-assets/roles'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

async function requirePayloadUser() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return { payload, user }
}

export async function POST(request: Request) {
  const { payload, user } = await requirePayloadUser()

  if (!user) {
    return NextResponse.json({ error: 'Payload admin login required' }, { status: 401 })
  }

  const missingEnv = getMissingGoogleDriveEnv()

  if (missingEnv.length) {
    return NextResponse.json(
      {
        error: 'Google Drive upload is not configured',
        missing_env: missingEnv,
      },
      { status: 500 },
    )
  }

  const formData = await request.formData()
  const clientId = String(formData.get('client_id') || '').trim()
  const role = normalizeBrandAssetRole(String(formData.get('role') || 'image_ref'))
  const referenceNotes = String(formData.get('reference_notes') || '').trim()
  const files = formData.getAll('files').filter((file): file is File => file instanceof File)

  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }

  if (!files.length) {
    return NextResponse.json({ error: 'At least one file is required' }, { status: 400 })
  }

  const uploaded = []
  const clientDocs = await payload.find({
    collection: 'clients',
    where: { client_id: { equals: clientId } },
    limit: 1,
  })
  const client = clientDocs.docs[0]
  const driveIds = client?.drive_folder_ids_json as Record<string, string> | null | undefined

  const targetFolderId = (() => {
    if (!driveIds) return undefined
    if (role === 'image_ref') return driveIds.food || driveIds.products || driveIds.root
    if (role === 'face_ref') return driveIds.team_faces || driveIds.root
    if (role === 'pdf_ref') return driveIds.materials || driveIds.root
    if (role === 'competitor_ref') return driveIds.competitors || driveIds.root
    if (role === 'moodboard' || role === 'color_board' || role === 'style_ref' || role === 'logo_ref') {
      return driveIds.moodboards || driveIds.root
    }
    if (role === 'background_ref') return driveIds.locations || driveIds.root
    return driveIds.root
  })()

  for (const file of files) {
    try {
      const driveResult = await uploadFileToGoogleDrive({
        file,
        clientId,
        role,
        folderId: targetFolderId,
      })

      const asset = await createClientReferenceAsset({
        clientId,
        role,
        fileUrl: driveResult.webViewLink || driveResult.webContentLink || '',
        publicUrl: driveResult.webViewLink || driveResult.webContentLink || '',
        assetType: file.type || driveResult.mimeType || 'application/octet-stream',
        referenceNotes,
        metadata: {
          file_name: driveResult.name || file.name,
          google_drive_file_id: driveResult.id,
          google_drive_web_view_link: driveResult.webViewLink || '',
          google_drive_web_content_link: driveResult.webContentLink || '',
          uploaded_by: user.email || 'payload_admin',
        },
      })

      uploaded.push(asset)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Google Drive upload failed',
          details: error instanceof Error ? error.message : 'Unknown upload error',
          file: file.name,
        },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({ uploaded })
}
