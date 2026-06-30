import { buildOpenRouterChatBody, logAiCost } from '@/lib/ai/modelRouter'

type TelegramButton = {
  text: string
  callback_data?: string
  url?: string
}

type TelegramReplyMarkup = {
  inline_keyboard: TelegramButton[][]
}

type TelegramSession = {
  client_id: string | null
  client_name: string | null
  current_action: string | null
  current_stage: string | null
  session_json: Record<string, unknown>
}

type ParsedTelegramUpdate = {
  chatId: string
  userId: string
  messageId: string
  replyToMessageId: string
  commandText: string
  caption: string
  callbackData: string
  callbackQueryId: string
  photoFileId: string
  videoFileId: string
  documentFileId: string
  hasAttachment: boolean
}

type IntentResult = {
  action: string
  actionArg: string
  confidence: number
}

type N8nTelegramResponse = {
  telegram_text?: string
  telegram_reply_markup?: unknown
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BRANDING_TELEGRAM_BOT_TOKEN || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY || ''

import { getResearchPool as getPool } from '@/lib/research/db'

function resolveN8nWebhookUrl() {
  const explicit = process.env.WF10_BRAND_WEBHOOK_URL
  if (explicit) return explicit

  const configured = process.env.N8N_WEBHOOK_URL || 'https://n8n.cabij.co'
  if (configured.includes('/webhook/')) return configured

  return `${configured.replace(/\/$/, '')}/webhook/agency-os-branding`
}

function parseUpdate(update: unknown): ParsedTelegramUpdate | null {
  const value = update && typeof update === 'object' ? (update as Record<string, any>) : null
  if (!value) return null

  const message = value.message || value.edited_message
  const callback = value.callback_query

  if (callback) {
    return {
      chatId: String(callback.message?.chat?.id || ''),
      userId: String(callback.from?.id || ''),
      messageId: String(callback.message?.message_id || ''),
      replyToMessageId: '',
      commandText: String(callback.data || ''),
      caption: '',
      callbackData: String(callback.data || ''),
      callbackQueryId: String(callback.id || ''),
      photoFileId: '',
      videoFileId: '',
      documentFileId: '',
      hasAttachment: false,
    }
  }

  if (!message) return null

  const photos = Array.isArray(message.photo) ? message.photo : []
  const largestPhoto = photos[photos.length - 1]

  return {
    chatId: String(message.chat?.id || ''),
    userId: String(message.from?.id || ''),
    messageId: String(message.message_id || ''),
    replyToMessageId: String(message.reply_to_message?.message_id || ''),
    commandText: String(message.text || message.caption || ''),
    caption: String(message.caption || ''),
    callbackData: '',
    callbackQueryId: '',
    photoFileId: String(largestPhoto?.file_id || ''),
    videoFileId: String(message.video?.file_id || ''),
    documentFileId: String(message.document?.file_id || ''),
    hasAttachment: Boolean(largestPhoto?.file_id || message.video?.file_id || message.document?.file_id),
  }
}

function safeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

async function loadSession(chatId: string): Promise<TelegramSession> {
  const result = await getPool().query(
    `
      WITH client_registry AS (
        SELECT client_id, client_name, status::text AS status, created_at, 1 AS source_priority
        FROM clients
        UNION ALL
        SELECT client_id, client_name, status::text AS status, created_at, 2 AS source_priority
        FROM client
      ),
      client_base AS (
        SELECT client_id, client_name
        FROM (
          SELECT *,
                 row_number() OVER (
                   PARTITION BY client_id
                   ORDER BY source_priority ASC, created_at DESC NULLS LAST
                 ) AS row_rank
          FROM client_registry
        ) deduped
        WHERE row_rank = 1
      )
      SELECT s.client_id, cb.client_name, s.current_action, s.current_stage, s.session_json
      FROM brand_session s
      LEFT JOIN client_base cb ON cb.client_id = s.client_id
      WHERE s.telegram_chat_id = $1
      LIMIT 1
    `,
    [chatId],
  )

  const row = result.rows[0]
  if (!row) {
    return {
      client_id: null,
      client_name: null,
      current_action: null,
      current_stage: null,
      session_json: {},
    }
  }

  return {
    client_id: row.client_id || null,
    client_name: row.client_name || null,
    current_action: row.current_action || null,
    current_stage: row.current_stage || null,
    session_json: safeJsonObject(row.session_json),
  }
}

async function ensureSession(chatId: string) {
  await getPool().query(
    `
      INSERT INTO brand_session (telegram_chat_id, current_action, session_json, updated_at)
      VALUES ($1, NULL, '{}'::jsonb, now())
      ON CONFLICT (telegram_chat_id)
      DO UPDATE SET updated_at = now()
    `,
    [chatId],
  )
}

async function setCurrentAction(chatId: string, currentAction: string | null, patch?: Record<string, unknown>) {
  await getPool().query(
    `
      INSERT INTO brand_session (telegram_chat_id, current_action, session_json, updated_at)
      VALUES ($1, $2, $3::jsonb, now())
      ON CONFLICT (telegram_chat_id)
      DO UPDATE SET
        current_action = EXCLUDED.current_action,
        session_json = COALESCE(brand_session.session_json, '{}'::jsonb) || EXCLUDED.session_json,
        updated_at = now()
    `,
    [chatId, currentAction, JSON.stringify(patch || {})],
  )
}

function deterministicIntent(input: ParsedTelegramUpdate, session: TelegramSession): IntentResult | null {
  const text = (input.callbackData || input.commandText || '').trim()
  const normalized = text.toLowerCase().replace(/\s+/g, ' ')

  if (input.callbackData.startsWith('brand:')) {
    const [, action = '', actionArg = ''] = input.callbackData.split(':')
    return { action, actionArg, confidence: 100 }
  }

  if (session.current_action === 'collecting_brief' && text) {
    return { action: 'process_brief_input', actionArg: text, confidence: 100 }
  }

  if (session.current_action === 'revising_kit' && text) {
    return { action: 'process_kit_revision_input', actionArg: text, confidence: 100 }
  }

  const exact: Record<string, string> = {
    '/start': 'help',
    '/help': 'help',
    help: 'help',
    '/status': 'status',
    status: 'status',
    '/project_status': 'status',
    '/clients': 'list_clients',
    clients: 'list_clients',
    '/image_status': 'image_status',
    '/upload_references': 'request_client_images',
    '/brand_brief': 'brand_brief',
    '/generate_brand_strategy': 'generate_brand_strategy',
    '/generate_brand_kit': 'generate_brand_kit',
    '/compare_directions': 'compare_directions',
    '/revise_brand_kit': 'revise_brand_kit',
    '/export_brand_board': 'export_brand_board',
    '/export_deliverables': 'export_deliverables',
    '/send_client_review': 'send_client_review',
    '/marketing_strategy': 'marketing_strategy',
    '/social_strategy': 'social_strategy',
    '/cancel': 'cancel',
  }

  if (exact[normalized]) return { action: exact[normalized], actionArg: '', confidence: 100 }

  const newClientMatch = text.match(/^\/?(?:new_brand_client|load_client|load client|select client|open client|work on)\s+(.+)$/i)
  if (newClientMatch?.[1]) {
    return { action: 'new_brand_client', actionArg: newClientMatch[1].trim(), confidence: 95 }
  }

  if (input.hasAttachment) return { action: 'upload_brand_asset', actionArg: text, confidence: 100 }

  return null
}

function canonicalCommand(intent: IntentResult, originalText: string) {
  if (intent.action === 'status') return '/status'
  if (intent.action === 'help') return '/help'
  if (intent.action === 'list_clients') return '/clients'
  if (intent.action === 'request_client_images') return '/upload_references'
  if (intent.action === 'new_brand_client') return `/new_brand_client ${intent.actionArg}`.trim()
  if (intent.action === 'process_brief_input') return intent.actionArg || originalText
  if (intent.action === 'process_kit_revision_input') return intent.actionArg || originalText
  if (intent.action === 'upload_brand_asset') return originalText
  if (intent.action === 'llm_routing_required') return originalText

  return `/${intent.action}${intent.actionArg ? ` ${intent.actionArg}` : ''}`
}

async function classifyIntent(input: ParsedTelegramUpdate, session: TelegramSession): Promise<IntentResult> {
  const deterministic = deterministicIntent(input, session)
  if (deterministic) return deterministic

  if (!OPENROUTER_API_KEY) {
    return { action: 'llm_routing_required', actionArg: input.commandText, confidence: 0 }
  }

  const { route, body } = buildOpenRouterChatBody(
    'telegram_intent_detection',
    [
      {
        role: 'system',
        content: [
          'You route a Telegram operator message for a premium brand agency workstation.',
          'Return JSON only with action, action_arg, confidence.',
          'Supported actions: help, status, list_clients, new_brand_client, brand_brief, process_brief_input, analyze_existing_brand, request_client_images, image_status, upload_brand_asset, generate_brand_strategy, generate_brand_kit, approve_brand_direction, revise_brand_kit, process_kit_revision_input, compare_directions, export_brand_board, export_deliverables, send_client_review, marketing_strategy, social_strategy, cancel, clarification_required.',
          'Be flexible with plain English. Examples: "show my projects" -> list_clients, "make strategy" -> generate_brand_strategy, "create project for Sol House" -> new_brand_client with action_arg "Sol House", "client pack" -> export_deliverables.',
          'Do not invent client IDs or kit IDs. If approval lacks an exact kit id, use clarification_required.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify({
          message: input.commandText,
          callback_data: input.callbackData,
          active_client_id: session.client_id,
          active_client_name: session.client_name,
          current_action: session.current_action,
          current_stage: session.current_stage,
        }),
      },
    ],
    { responseFormat: 'json_object', budgetMode: 'balanced' },
  )

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PAYLOAD_PUBLIC_URL || 'https://workstation.cabij.co',
      'X-Title': 'Cabij Branding OS Telegram Router',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    return { action: 'clarification_required', actionArg: input.commandText, confidence: 0 }
  }

  const json = await response.json()
  const content = json?.choices?.[0]?.message?.content
  const parsed = typeof content === 'string' ? JSON.parse(content) : content

  await logAiCost(getPool(), {
    provider: 'openrouter',
    model: route.model,
    taskType: route.taskType,
    budgetMode: route.budgetMode,
    inputTokens: json?.usage?.prompt_tokens,
    outputTokens: json?.usage?.completion_tokens,
    clientId: session.client_id,
    workflowId: 'payload_telegram_router',
  }).catch(() => undefined)

  return {
    action: String(parsed?.action || 'clarification_required'),
    actionArg: String(parsed?.action_arg || ''),
    confidence: Number(parsed?.confidence || 0),
  }
}

function normalizeReplyMarkup(input: unknown): TelegramReplyMarkup | undefined {
  if (!input) return undefined

  let value = input
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return undefined
    }
  }

  if (!value || typeof value !== 'object') return undefined
  const objectValue = value as Record<string, any>

  if (Array.isArray(objectValue.inline_keyboard)) {
    return {
      inline_keyboard: objectValue.inline_keyboard.map((row: any[]) =>
        row.map((button) => ({
          text: String(button.text || 'Open'),
          ...(button.callback_data ? { callback_data: String(button.callback_data) } : {}),
          ...(button.url ? { url: String(button.url) } : {}),
        })),
      ),
    }
  }

  if (Array.isArray(objectValue.rows)) {
    return {
      inline_keyboard: objectValue.rows.map((entry: any) => {
        const buttons = entry?.row?.buttons || []
        return buttons.map((button: any) => {
          const additional = button.additionalFields || {}
          return {
            text: String(button.text || 'Open'),
            ...(additional.callback_data ? { callback_data: String(additional.callback_data) } : {}),
            ...(additional.url ? { url: String(additional.url) } : {}),
          }
        })
      }),
    }
  }

  return undefined
}

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: unknown) {
  if (!TELEGRAM_TOKEN) {
    console.warn('Telegram token missing. Would send:', text)
    return
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      reply_markup: normalizeReplyMarkup(replyMarkup),
    }),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok || json?.ok === false) {
    throw new Error(`Telegram sendMessage failed: ${json?.description || response.statusText}`)
  }
}

async function answerCallback(callbackQueryId: string) {
  if (!TELEGRAM_TOKEN || !callbackQueryId) return

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  }).catch(() => undefined)
}

async function delegateToN8n(input: ParsedTelegramUpdate, intent: IntentResult): Promise<N8nTelegramResponse> {
  const response = await fetch(resolveN8nWebhookUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: input.chatId,
      user_id: input.userId,
      telegram_message_id: input.messageId,
      reply_to_message_id: input.replyToMessageId,
      command_text: input.callbackData ? input.commandText : canonicalCommand(intent, input.commandText),
      caption: input.caption,
      callback_data: input.callbackData,
      photo_file_id: input.photoFileId,
      video_file_id: input.videoFileId,
      document_file_id: input.documentFileId,
      has_attachment: input.hasAttachment,
      payload_router_action: intent.action,
      payload_router_action_arg: intent.actionArg,
      payload_router_confidence: intent.confidence,
    }),
  })

  const text = await response.text()
  let json: N8nTelegramResponse = {}

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { telegram_text: text }
  }

  if (!response.ok) {
    throw new Error(`n8n returned ${response.status}: ${text.slice(0, 500)}`)
  }

  return json
}

function localHelpMarkup(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Active Clients', callback_data: 'brand:list_clients' },
        { text: 'Status', callback_data: 'brand:status' },
      ],
      [
        { text: 'Generate Strategy', callback_data: 'brand:generate_brand_strategy' },
        { text: 'Generate Brand Kit', callback_data: 'brand:generate_brand_kit' },
      ],
      [
        { text: 'Upload References', callback_data: 'brand:upload_references' },
        { text: 'Export Pack', callback_data: 'brand:export_deliverables' },
      ],
    ],
  }
}

async function sendLocalHelp(chatId: string) {
  await sendTelegramMessage(
    chatId,
    [
      'Branding OS control panel',
      '',
      'You can use plain English:',
      '- show my active clients',
      '- create a new brand project for Sol House',
      '- generate the strategy',
      '- make 3 brand kit directions',
      '- export the final client pack',
    ].join('\n'),
    localHelpMarkup(),
  )
}

export async function handleTelegramUpdate(update: unknown): Promise<{ ok: boolean; ignored?: boolean; error?: string }> {
  try {
    const input = parseUpdate(update)
    if (!input?.chatId) return { ok: true, ignored: true }

    await answerCallback(input.callbackQueryId)
    await ensureSession(input.chatId)

    const session = await loadSession(input.chatId)
    const intent = await classifyIntent(input, session)

    if (intent.action === 'help') {
      await sendLocalHelp(input.chatId)
      return { ok: true }
    }

    if (intent.action === 'revise_brand_kit') {
      await setCurrentAction(input.chatId, 'revising_kit')
    }

    const n8nResponse = await delegateToN8n(input, intent)
    await sendTelegramMessage(
      input.chatId,
      n8nResponse.telegram_text || 'Done. The workstation has been updated.',
      n8nResponse.telegram_reply_markup,
    )

    return { ok: true }
  } catch (error) {
    console.error('Telegram hybrid router error:', error)
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
