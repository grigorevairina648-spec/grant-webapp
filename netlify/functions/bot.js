exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'ok' };
  }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const WEBAPP_URL = process.env.WEBAPP_URL;

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 200, body: 'ok' }; }

  const message = body.message;
  const callbackQuery = body.callback_query;

  async function sendMessage(chatId, text, extra = {}) {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra })
    });
  }

  // Обработка данных из WebApp (когда пользователь нажал "Полный отчёт")
  if (message?.web_app_data) {
    const chatId = message.chat.id;
    try {
      const data = JSON.parse(message.web_app_data.data);

      if (data.action === 'report') {
        const p = data.profile;
        await sendMessage(chatId,
          `📋 <b>Запрос детального отчёта</b>\n\n` +
          `Профиль: ${p.org_form}, ${p.region}\n` +
          `ОКВЭД: ${p.okved}\n` +
          `Цели: ${(p.goals || []).join(', ') || '—'}\n\n` +
          `Топ программы: ${data.top_programs}\n\n` +
          `⏳ Готовлю полный отчёт с документами...`
        );

        // Запрос детального отчёта через Claude API
        const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: `Подготовь краткий отчёт по подбору господдержки для клиента.
Профиль: ${p.org_form}, ${p.biz_size || ''}, регион: ${p.region}, ОКВЭД: ${p.okved}.
Цели: ${(p.goals || []).join(', ')}.
Топ программ из анализа: ${data.top_programs}.

Составь список из 3 программ с:
1. Название и организатор
2. Размер поддержки
3. Топ-3 документа для подачи
4. Ссылка
5. Главный совет по заявке

Формат: текст для Telegram без markdown, с эмодзи. Не используй ** или #. Максимум 1500 символов.`
            }]
          })
        });

        const claudeData = await claudeResp.json();
        const reportText = claudeData.content?.map(c => c.text || '').join('') || 'Не удалось сформировать отчёт.';

        await sendMessage(chatId, reportText, {
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Открыть promote.budget.gov.ru', url: 'https://promote.budget.gov.ru' }
            ]]
          }
        });

      } else if (data.action === 'detail') {
        await sendMessage(chatId,
          `🔍 Детали по программе:\n<b>${data.program}</b>\n\nПоищите актуальную информацию на портале:`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '🌐 promote.budget.gov.ru', url: 'https://promote.budget.gov.ru' }
              ]]
            }
          }
        );
      }
    } catch (e) {
      await sendMessage(chatId, 'Произошла ошибка при обработке запроса. Попробуйте ещё раз.');
    }

    return { statusCode: 200, body: 'ok' };
  }

  // Обычные сообщения
  if (message) {
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || '';
    const text = message.text || '';

    const webAppButton = {
      reply_markup: {
        inline_keyboard: [[{
          text: '🔍 Подобрать программы поддержки',
          web_app: { url: WEBAPP_URL }
        }]]
      }
    };

    if (text === '/start') {
      await sendMessage(chatId,
        `👋 Привет${firstName ? ', ' + firstName : ''}!\n\n` +
        `Я помогу найти <b>гранты, субсидии и меры господдержки</b> для вашего бизнеса.\n\n` +
        `Источники проверки:\n` +
        `• promote.budget.gov.ru (Минфин)\n` +
        `• Программы МСП и Корпорация МСП\n` +
        `• ФРП, Сколково, РЭЦ, РФРИТ\n` +
        `• Региональные фонды\n\n` +
        `Нажмите кнопку и заполните короткую анкету 👇`,
        webAppButton
      );
    } else if (text === '/help') {
      await sendMessage(chatId,
        `ℹ️ <b>Как пользоваться:</b>\n\n` +
        `1. Нажмите кнопку «Подобрать программы»\n` +
        `2. Заполните анкету (3 шага, ~2 мин)\n` +
        `3. Получите список подходящих программ\n` +
        `4. Нажмите «Полный отчёт» для детального разбора\n\n` +
        `/start — начать заново`,
        webAppButton
      );
    } else {
      await sendMessage(chatId,
        `Нажмите кнопку для подбора мер государственной поддержки 👇`,
        webAppButton
      );
    }
  }

  return { statusCode: 200, body: 'ok' };
};
