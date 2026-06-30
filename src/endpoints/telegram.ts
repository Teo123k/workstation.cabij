import type { Endpoint, PayloadRequest } from 'payload'

import { handleTelegramUpdate } from '@/lib/telegram/hybrid-router'

export const telegramWebhookEndpoint: Endpoint = {
  path: '/telegram/webhook',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const update =
      (req as PayloadRequest & { data?: unknown }).data ??
      (typeof req.json === 'function' ? await req.json() : null)

    const result = await handleTelegramUpdate(update)

    return Response.json(result, { status: result.ok ? 200 : 500 })
  },
}
