# Агент подбора господдержки — Telegram WebApp

## Структура файлов

```
├── index.html                        ← WebApp (страница агента)
├── netlify.toml                      ← конфиг Netlify
└── netlify/functions/
    ├── claude.js                     ← прокси к Claude API
    └── bot.js                        ← webhook Telegram бота
```

## Деплой на Netlify

1. Загрузи папку в GitHub репозиторий
2. Netlify → Add new site → Import from GitHub
3. Настройки деплоя по умолчанию, нажми Deploy

## Переменные окружения (Netlify → Site → Environment variables)

| Переменная          | Значение                              |
|---------------------|---------------------------------------|
| ANTHROPIC_API_KEY   | sk-ant-... (из console.anthropic.com) |
| TELEGRAM_TOKEN      | 7123...:AAF... (от @BotFather)        |
| WEBAPP_URL          | https://ИМЯ.netlify.app               |

## Настройка после деплоя

### 1. Обнови URL прокси в index.html
Найди строку и замени на свой домен Netlify:
```
const PROXY_URL = 'https://ВАШ-САЙТ.netlify.app/.netlify/functions/claude';
```

### 2. Зарегистрируй webhook бота
Открой в браузере (один раз):
```
https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://ИМЯ.netlify.app/.netlify/functions/bot
```
Должно вернуть: {"ok":true}

### 3. Зарегистрируй WebApp у @BotFather
```
@BotFather → /newapp → выбери бота → Web App URL: https://ИМЯ.netlify.app
```

## Проверка работы

- Напиши боту /start — должна появиться кнопка
- Нажми кнопку — откроется WebApp с формой
- Заполни анкету — получи список программ
