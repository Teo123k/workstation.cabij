'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function bulkDeleteClients(clientIds: string[]) {
  if (!clientIds || clientIds.length === 0) {
    return { success: false, error: 'No clients selected' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })

    if (!user) {
      return { success: false, error: 'Payload admin login required' }
    }

    for (const id of clientIds) {
      await payload.delete({
        collection: 'clients',
        where: {
          client_id: {
            equals: id,
          },
        },
      })
    }

    revalidatePath('/clients')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting clients:', error)
    return { success: false, error: error.message || 'Failed to delete clients' }
  }
}
