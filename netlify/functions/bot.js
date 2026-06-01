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
        await sendMessage(chatId, `Готовлю отчёт по программам господдержки...`);
        const cr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: `Подбери господдержку. Профиль: ${p.org_form}, регион: ${p.region}, ОКВЭД: ${p.okved}, цели: ${(p.goals||[]).join(', ')}. Топ программ: ${data.top_programs}. Укажи 3 программы с названием, суммой, топ-3 документами, ссылкой, советом. Текст для Telegram, без markdown, с эмодзи, до 1500 символов.` }] })
        });
        const cd = await cr.json();
        const txt = cd.content?.map(c=>c.text||'').join('') || 'Не удалось сформировать отчёт.';
        await sendMessage(chatId, txt, { reply_markup: { inline_keyboard: [[{ text: 'promote.budget.gov.ru', url: 'https://promote.budget.gov.ru' }]] } });
      } else if (data.action === 'detail') {
        await sendMessage(chatId, `Программа: <b>${data.program}</b>\n\nАктуальная информация:`, { reply_markup: { inline_keyboard: [[{ text: 'promote.budget.gov.ru', url: 'https://promote.budget.gov.ru' }]] } });
      }
    } catch(e) {
      await sendMessage(message.chat.id, 'Ошибка. Попробуйте ещё раз.');
    }
    return { statusCode: 200, body: 'ok' };
  }
  if (message) {
    const chatId = message.chat.id;
    const name = message.from?.first_name || '';
    const text = message.text || '';
    const btn = { reply_markup: { inline_keyboard: [[{ text: 'Подобрать программы поддержки', web_app: { url: WEBAPP_URL } }]] } };
    if (text === '/start') {
      await send
