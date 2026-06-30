import { Endpoint, PayloadRequest } from 'payload'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/agency-os-branding'; // URL of n8n webhook

/**
 * Helper to send a message via Telegram Bot API
 */
async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  if (!TELEGRAM_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Mocking send:", text);
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram API Error:", data.description);
    }
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}

/**
 * Payload Endpoint to receive Telegram webhooks
 */
export const telegramWebhookEndpoint: Endpoint = {
  path: '/telegram/webhook',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const update = await req.json();
      const payload = req.payload;

      let chatId = '';
      let text = '';
      let isCallback = false;
      let callbackQueryId = '';

      if (update.message) {
        chatId = String(update.message.chat.id);
        text = update.message.text || '';
      } else if (update.callback_query) {
        chatId = String(update.callback_query.message.chat.id);
        text = update.callback_query.data;
        isCallback = true;
        callbackQueryId = update.callback_query.id;
      } else {
        return Response.json({ ok: true });
      }

      if (!text) return Response.json({ ok: true });

      // Fetch or Create Session
      const sessions = await payload.find({
        collection: 'brandSessions',
        where: { telegram_chat_id: { equals: chatId } },
        limit: 1,
      });
      let session = sessions.docs[0];
      if (!session) {
        session = await payload.create({
          collection: 'brandSessions',
          data: { telegram_chat_id: chatId },
        });
      }

      // 1. Determine Action
      let action = 'unknown';
      let actionArg = '';

      if (isCallback && text.startsWith('brand:')) {
        action = text.replace('brand:', '');
      } else if (text === '/start' || text === '/help') {
        action = 'help';
      } else if (text === '/status') {
        action = 'status';
      } else if (text === '/revise_brand_kit') {
        action = 'revise_brand_kit';
      } else if (text === '/compare_directions') {
        action = 'compare_directions';
      } else if (session.current_action === 'revising_kit') {
        actionArg = text;
        action = 'process_kit_revision_input';
      } else {
        action = 'clarification_required';
      }

      // 2. Acknowledge callback query
      if (isCallback && TELEGRAM_TOKEN) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQueryId })
        });
      }

      // 3. Handle UI natively in Payload
      if (action === 'help') {
        await sendTelegramMessage(chatId, "Welcome to the Hybrid Branding OS. What would you like to do?", {
          inline_keyboard: [
            [{ text: "📝 New Client", callback_data: "brand:new_brand_client" }, { text: "📊 Status", callback_data: "brand:status" }],
            [{ text: "🧠 Generate Strategy", callback_data: "brand:generate_brand_strategy" }, { text: "🎨 Generate Brand Kit", callback_data: "brand:generate_brand_kit" }]
          ]
        });
      } 
      else if (action === 'status') {
         await sendTelegramMessage(chatId, "Project Status: \n\nWe are running on the Hybrid Payload Router! Native TS handles UI.");
      }
      else if (action === 'revise_brand_kit') {
         // Fix the exact bug the user was stuck on!
         await payload.update({
            collection: 'brandSessions',
            id: session.id,
            data: { current_action: 'revising_kit' }
         });
         
         await sendTelegramMessage(chatId, "What would you like to change about this direction? Describe your feedback:", {
            inline_keyboard: [
               [{ text: "📋 Status", callback_data: "brand:status" }, { text: "🏠 Home", callback_data: "brand:help" }]
            ]
         });
      }
      else if (action === 'process_kit_revision_input') {
         // User provided feedback text!
         await payload.update({
            collection: 'brandSessions',
            id: session.id,
            data: { current_action: null } // Clear state
         });
         
         await sendTelegramMessage(chatId, `Got your feedback: "${actionArg}". \n\nDelegating to n8n heavy-lifter to process revision...`);
         
         // Delegate heavy lifting to n8n
         await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               chat_id: chatId,
               command_text: actionArg,
               action: 'process_kit_revision_input'
            })
         });
      }
      else {
        // Fallback: Delegate EVERYTHING else to existing n8n workflow
        await sendTelegramMessage(chatId, `Delegating action: ${action} to n8n...`);
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            command_text: text,
            action: action
          })
        });
      }

      return Response.json({ ok: true });
    } catch (error) {
      console.error("Telegram Webhook Error:", error);
      return Response.json({ ok: false, error: String(error) });
    }
  }
}
