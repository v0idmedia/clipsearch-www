# CLIP Search — PHP-лендинг

Самодостаточная версия лендинга без Node.js, React и OpenAI Sites. Для работы
нужен PHP 7.1 или новее. В production проект рассчитан на Docker/Portainer.

## Локальный запуск в Windows

Запустите `start-local.bat` двойным кликом. Сайт откроется по адресу
`http://127.0.0.1:8080`. Для локальной капчи скрипт использует официальные
тестовые ключи Cloudflare Turnstile. Без настроенного relay форма корректно
покажет сообщение о временной недоступности отправки.

## Docker / Portainer

Создайте Stack из `docker-compose.yml` и задайте переменные:

```text
TELEGRAM_RELAY_URL=https://clipsearch-telegram-relay.example.workers.dev/v1/telegram
TELEGRAM_RELAY_SECRET=<общий случайный секрет длиной не менее 32 символов>
TELEGRAM_CONNECT_TIMEOUT=5
TELEGRAM_TIMEOUT=12
TURNSTILE_SITE_KEY=<публичный ключ Invisible Turnstile для clipsearch.ru>
TURNSTILE_SECRET_KEY=<секретный ключ того же Turnstile>
YANDEX_METRIKA_ID=<только числовой номер счётчика>
```

`TELEGRAM_RELAY_SECRET` должен полностью совпадать с `RELAY_SHARED_SECRET` в
Cloudflare Worker. Секреты не добавляйте в Git.

## Telegram через Cloudflare Worker

Готовый Worker находится в `cloudflare/telegram-relay/worker.js`. В настройках
Worker добавьте encrypted secrets:

```text
RELAY_SHARED_SECRET=<тот же секрет, что в Portainer>
TELEGRAM_BOT_TOKEN=<токен BotFather>
TELEGRAM_CHAT_ID=<ID группы или супергруппы>
TELEGRAM_MESSAGE_THREAD_ID=<ID темы форума, либо 0>
```

При необходимости добавьте обычную переменную `ORIGIN_IP` с публичным IPv4
сервера сайта. Подробная памятка находится в
`cloudflare/telegram-relay/README.md`.

Браузер отправляет форму только в `/submit.php`. PHP валидирует одноразовый
Turnstile-токен, подписывает тело HMAC-SHA256 и передаёт его Worker. Токен бота,
ID чата и ID темы остаются в Cloudflare. Worker принимает запросы не старше
пяти минут и отправляет заявку в заданную тему Telegram через `sendMessage`.

В сообщение входят ID заявки, имя, телефон, почта, компания, московское время,
страница и точная кнопка/источник открытия формы.

## Cloudflare Turnstile

Виджет должен быть создан в Cloudflare в режиме **Invisible**. На сайте он
запускается только при отправке формы. Серверная проверка включает:

- одноразовый токен и UUID `idempotency_key` для безопасного повтора;
- проверку `action=clipsearch_lead` и hostname;
- два cURL-повтора, IPv4 и резервный PHP stream-транспорт;
- отдельные ответы для отказа проверки и временной недоступности Siteverify.

## Яндекс Метрика

Достаточно задать `YANDEX_METRIKA_ID` в Stack. Метрика и Вебвизор включаются
только после выбора «Разрешить все» в уведомлении cookies. Выбор «Только
необходимые» не загружает Метрику, а при изменении ранее выданного согласия
счётчик деинициализируется.

Предусмотрены JavaScript-цели:

- `lead_open` — открыта всплывающая форма;
- `lead_success` — заявка доставлена в Telegram;
- `lead_error` — заявка не доставлена.

## Структура

- `public/index.php` — лендинг и формы;
- `public/submit.php` — валидация формы, Turnstile и HMAC relay;
- `public/includes/cookie-consent-head.php` — раннее чтение настройки cookies;
- `public/includes/cookie-consent-body.php` — уведомление и выбор согласия;
- `cloudflare/telegram-relay/` — код и конфигурация Cloudflare Worker;
- `public/assets/` — стили, JavaScript, шрифт и изображения;
- `Dockerfile`, `docker-compose.yml` — Docker/Portainer;
- `start-local.bat` — локальный запуск Windows.
