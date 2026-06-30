import 'dotenv/config'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PAYLOAD_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://your-ngrok-domain.ngrok-free.app';

if (!TELEGRAM_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const webhookUrl = `${PAYLOAD_URL}/api/telegram/webhook`;

async function registerWebhook() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    const data = await response.json();
    console.log("Telegram API Response:", data);
  } catch (error) {
    console.error("Failed to register webhook:", error);
  }
}

registerWebhook();
