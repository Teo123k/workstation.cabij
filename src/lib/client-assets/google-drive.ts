type DriveUploadResult = {
  id: string
  name?: string
  webViewLink?: string
  webContentLink?: string
  mimeType?: string
}

const REQUIRED_ENV = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'GOOGLE_DRIVE_OUTPUT_FOLDER_ID',
] as const

export function getMissingGoogleDriveEnv(): string[] {
  return REQUIRED_ENV.filter((name) => !process.env[name])
}

async function getGoogleDriveAccessToken(): Promise<string> {
  const missing = getMissingGoogleDriveEnv()

  if (missing.length) {
    throw new Error(`Missing Google Drive env vars: ${missing.join(', ')}`)
  }

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })

  const json = (await response.json().catch(() => ({}))) as { access_token?: string; error?: string }

  if (!response.ok || !json.access_token) {
    throw new Error(json.error || 'Google OAuth token request failed')
  }

  return json.access_token
}

export async function uploadFileToGoogleDrive(params: {
  file: File
  clientId: string
  role: string
  folderId?: string
}): Promise<DriveUploadResult> {
  const accessToken = await getGoogleDriveAccessToken()
  const folderId = params.folderId || process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID || ''
  const safeName = params.file.name || `${params.role}-${Date.now()}`
  const boundary = `branding-os-${Date.now()}`
  const metadata = {
    name: `${params.clientId}/${params.role}/${safeName}`.replace(/\/+/g, ' - '),
    parents: [folderId],
  }
  const fileBuffer = Buffer.from(await params.file.arrayBuffer())
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\ncontent-type: ${params.file.type || 'application/octet-stream'}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,mimeType',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )

  const json = (await response.json().catch(() => ({}))) as DriveUploadResult & { error?: { message?: string } }

  if (!response.ok || !json.id) {
    throw new Error(json.error?.message || 'Google Drive upload failed')
  }

  if (process.env.GOOGLE_DRIVE_PUBLIC_UPLOADS === 'true') {
    await fetch(`https://www.googleapis.com/drive/v3/files/${json.id}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }).catch(() => undefined)
  }

  return json
}
