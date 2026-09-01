<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond(bool $ok, string $message, int $status, bool $json): void
{
    http_response_code($status);
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($ok) {
        header('Location: /?sent=1#contact');
    } else {
        header('Location: /?error=' . rawurlencode($message) . '#contact');
    }
    exit;
}

function requestHostIsLocal(): bool
{
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $host = (string)preg_replace('/:\d+$/', '', $host);
    return in_array($host, ['localhost', '127.0.0.1', '[::1]', '::1'], true);
}

function validateTurnstile(string $token, string $secret, string $remoteIp): bool
{
    if ($token === '' || strlen($token) > 2048) {
        return false;
    }

    $payload = [
        'secret' => $secret,
        'response' => $token,
    ];
    if ($remoteIp !== '' && filter_var($remoteIp, FILTER_VALIDATE_IP)) {
        $payload['remoteip'] = $remoteIp;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
            'content' => http_build_query($payload, '', '&'),
            'timeout' => 8,
            'ignore_errors' => true,
        ],
    ]);

    $response = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    if ($response === false) {
        error_log('CLIP Search: Turnstile Siteverify is unavailable.');
        return false;
    }

    $result = json_decode($response, true);
    if (!is_array($result) || empty($result['success'])) {
        $errorCodes = is_array($result) && isset($result['error-codes']) && is_array($result['error-codes'])
            ? implode(', ', $result['error-codes'])
            : 'invalid-response';
        error_log('CLIP Search: Turnstile validation failed: ' . $errorCodes);
        return false;
    }

    return true;
}

function telegramHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function sendTelegramMessage(string $botToken, string $chatId, string $text): bool
{
    $payload = [
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML',
        'link_preview_options' => json_encode(['is_disabled' => true]),
    ];

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
            'content' => http_build_query($payload, '', '&'),
            'timeout' => 10,
            'ignore_errors' => true,
        ],
    ]);

    $endpoint = 'https://api.telegram.org/bot' . $botToken . '/sendMessage';
    $response = @file_get_contents($endpoint, false, $context);
    if ($response === false) {
        error_log('CLIP Search: Telegram Bot API is unavailable.');
        return false;
    }

    $result = json_decode($response, true);
    if (!is_array($result) || empty($result['ok'])) {
        $description = is_array($result) && isset($result['description'])
            ? (string)$result['description']
            : 'invalid-response';
        error_log('CLIP Search: Telegram sendMessage failed: ' . $description);
        return false;
    }

    return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Метод не поддерживается.', 405, $wantsJson);
}

if (!empty($_POST['website'])) {
    respond(true, 'Заявка принята.', 200, $wantsJson);
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$company = trim((string)($_POST['company'] ?? ''));
$source = trim((string)($_POST['source'] ?? ''));
$consent = (string)($_POST['consent'] ?? '') === '1';

if ($name === '' || $phone === '' || $email === '' || $company === '' || !$consent) {
    respond(false, 'Заполните все поля и подтвердите согласие.', 422, $wantsJson);
}

if (strlen($name) > 120 || strlen($phone) > 60 || strlen($email) > 190 || strlen($company) > 190) {
    respond(false, 'Одно из полей заполнено слишком длинным текстом.', 422, $wantsJson);
}

$source = (string)preg_replace('/\s+/u', ' ', $source);
if ($source === '') {
    $source = 'Источник не определён';
}
if (strlen($source) > 240) {
    respond(false, 'Некорректный источник заявки.', 422, $wantsJson);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Проверьте адрес электронной почты.', 422, $wantsJson);
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) < 7) {
    respond(false, 'Проверьте номер телефона.', 422, $wantsJson);
}

$turnstileSecret = trim((string)(getenv('TURNSTILE_SECRET_KEY') ?: ''));
if ($turnstileSecret === '' && requestHostIsLocal()) {
    $turnstileSecret = '1x0000000000000000000000000000000AA';
}
if ($turnstileSecret === '') {
    error_log('CLIP Search: TURNSTILE_SECRET_KEY is not configured.');
    respond(false, 'Форма временно недоступна. Позвоните нам или попробуйте позже.', 503, $wantsJson);
}

$turnstileToken = trim((string)($_POST['cf-turnstile-response'] ?? ''));
$remoteIp = trim((string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
if (!validateTurnstile($turnstileToken, $turnstileSecret, $remoteIp)) {
    respond(false, 'Не удалось подтвердить, что форму отправляет человек. Обновите проверку и попробуйте ещё раз.', 422, $wantsJson);
}

$botToken = trim((string)(getenv('TELEGRAM_BOT_TOKEN') ?: ''));
$chatId = trim((string)(getenv('TELEGRAM_CHAT_ID') ?: ''));
if ($botToken === '' || $chatId === '') {
    error_log('CLIP Search: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
    respond(false, 'Сервис заявок временно недоступен. Позвоните нам или попробуйте позже.', 503, $wantsJson);
}
if (!preg_match('/^\d+:[A-Za-z0-9_-]+$/', $botToken) || strlen($chatId) > 100 || preg_match('/[\r\n]/', $chatId)) {
    error_log('CLIP Search: invalid Telegram configuration.');
    respond(false, 'Сервис заявок временно недоступен. Позвоните нам или попробуйте позже.', 503, $wantsJson);
}

$submittedAt = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
$message = "📩 <b>Новая заявка CLIP Search</b>\n\n"
    . '<b>Имя:</b> ' . telegramHtml($name) . "\n"
    . '<b>Телефон:</b> ' . telegramHtml($phone) . "\n"
    . '<b>Почта:</b> ' . telegramHtml($email) . "\n"
    . '<b>Компания:</b> ' . telegramHtml($company) . "\n"
    . '<b>Источник:</b> ' . telegramHtml($source) . "\n"
    . '<b>Время:</b> ' . $submittedAt->format('d.m.Y H:i:s') . ' МСК';

if (!sendTelegramMessage($botToken, $chatId, $message)) {
    respond(false, 'Не удалось отправить заявку. Позвоните нам или попробуйте позже.', 502, $wantsJson);
}

respond(true, 'Заявка принята.', 200, $wantsJson);
