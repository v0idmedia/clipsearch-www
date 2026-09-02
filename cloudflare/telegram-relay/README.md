# Telegram relay для Cloudflare Workers

Worker принимает только подписанные сервером CLIP Search запросы и отправляет
их через Telegram Bot API. Токен бота, ID чата и ID темы не хранятся в
контейнере сайта.

## Секреты Worker

- `RELAY_SHARED_SECRET` — случайная строка длиной не менее 32 символов;
- `TELEGRAM_BOT_TOKEN` — токен BotFather;
- `TELEGRAM_CHAT_ID` — ID группы или супергруппы;
- `TELEGRAM_MESSAGE_THREAD_ID` — ID темы форума; `0`, если тема не нужна.

Необязательная переменная `ORIGIN_IP` ограничивает доступ публичным IPv4
адресом сервера CLIP Search.

После публикации URL приложения должен оканчиваться на `/v1/telegram`, например:

```text
https://clipsearch-telegram-relay.example.workers.dev/v1/telegram
```

В Portainer задайте:

```text
TELEGRAM_RELAY_URL=https://clipsearch-telegram-relay.example.workers.dev/v1/telegram
TELEGRAM_RELAY_SECRET=<то же значение, что RELAY_SHARED_SECRET в Worker>
```

Запрос подписывается HMAC-SHA256 вместе с Unix-временем. Worker принимает его
только в течение пяти минут, ограничивает размер тела и не включает CORS:
браузер напрямую к Worker не обращается.
