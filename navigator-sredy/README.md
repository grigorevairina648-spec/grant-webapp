# Сайт АНО «Навигатор среды»

Статический сайт (HTML/CSS/JS, без зависимостей). Страницы: `/`, `/o-nas/`, `/napravleniya/`, `/proekty/`, `/obuchenie/`, `/novosti/`, `/kontakty/`.

- Правки текстов и структуры: `build.js`, затем `node build.js`. Перед запуском в работу задайте домен: `SITE_URL=https://ваш-домен node build.js` (canonical, sitemap).
- Фото: см. `images/README.md`. Пока их нет, показываются иллюстрации-заглушки.
- Проекты и новости: `data/projects.json`, `data/news.json` — редактируются через `/admin/` (Decap CMS: Netlify Identity + Git Gateway) или вручную. Пока списки пусты, показываются пустые карточки.
- Форма обратной связи работает через Netlify Forms.
- Деплой: отдельный сайт Netlify, Base/Publish directory = `navigator-sredy`. Корневой сайт репозитория (Telegram-агент) не затронут.
- Не заполнено (нет данных): соцсети, карта, команда (кроме директора из карточки организации), партнёры, проекты, новости.
