exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'ok' };
  }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const WEBAPP_URL = process.env.WEBAPP_URL;

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 200, body: 'ok' }; }

  const message = body.message;

  async function sendMessage(chatId, text, extra = {}) {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra })
    });
  }

  if (message?.web_app_data) {
    const chatId = message.chat.id;
    try {
      const data = JSON.parse(message.web_app_data.data);
      if (data.action === 'report') {
        const p = data.profile;
        await sendMessage(chatId,
          `📋 <b>Запрос детального отчёта</b>\n\nПрофиль: ${p.org_form}, ${p.region}\nОКВЭД: ${p.okved}\nЦели: ${(p.goals||[]).join(', ')||'—'}\n\n⏳ Готовлю отчёт...`
        );
        co
