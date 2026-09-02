<?php
declare(strict_types=1);

ob_start();

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos((string)$_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond(bool $ok, string $message, int $status, bool $json, string $code = ''): void
{
    http_response_code($status);
    if ($json) {
        if (ob_get_level() > 0) {
            ob_clean();
        }
        header('Content-Type: application/json; charset=utf-8');
        header('X-Clipsearch-Result: ' . ($ok ? 'sent' : 'error'));
        echo json_encode([
            'ok' => $ok,
            'code' => $code !== '' ? $code : ($ok ? 'sent' : 'request_failed'),
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($ok) {
        header('Location: /?sent=1#contact');
    } else {
        header('Location: /?error=' . rawurlencode($message) . '#contact');
    }
    exit;
}

function requestHost(): string
{
    $host = strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? '')));
    return (string)preg_replace('/:\d+$/', '', $host);
}

function requestHostIsLocal(): bool
{
    return in_array(requestHost(), ['localhost', '127.0.0.1', '[::1]', '::1'], true);
}

function sanitizedLogValue(string $value, int $maxLength = 300): string
{
    $value = (string)preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value);
    $value = (string)preg_replace('/\s+/u', ' ', $value);
    return substr(trim($value), 0, $maxLength);
}

function uuidV4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-'
        . substr($hex, 8, 4) . '-'
        . substr($hex, 12, 4) . '-'
        . substr($hex, 16, 4) . '-'
        . substr($hex, 20, 12);
}

function redactSecret(string $message, string $secret): string
{
    return $secret === '' ? $message : str_replace($secret, '[redacted]', $message);
}

function postRequest(
    string $url,
    string $body,
    array $headers,
    int $connectTimeout,
    int $timeout,
    string $label,
    string $secretToRedact = ''
): array {
    $response = false;
    $status = 0;

    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        $options = [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => $connectTimeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_USERAGENT => 'CLIP-Search/1.0 form relay',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];
        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        }
        curl_setopt_array($handle, $options);
        $response = curl_exec($handle);
        $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($handle);
        $curlNumber = curl_errno($handle);
        curl_close($handle);

        if (!is_string($response) || $response === '') {
            error_log(
                'CLIP Search: ' . $label . ' cURL transport failed (error ' . $curlNumber . '): '
                . ($curlError !== '' ? redactSecret($curlError, $secretToRedact) : 'empty response')
            );
        }
    }

    if (!is_string($response) || $response === '') {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers) . "\r\n",
                'content' => $body,
                'timeout' => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);
        $streamError = '';
        set_error_handler(static function ($severity, $message) use (&$streamError): bool {
            $streamError = (string)$message;
            return true;
        });
        try {
            $stream = fopen($url, 'rb', false, $context);
        } finally {
            restore_error_handler();
        }

        if (is_resource($stream)) {
            $response = stream_get_contents($stream);
            $metadata = stream_get_meta_data($stream);
            fclose($stream);
            $responseHeaders = isset($metadata['wrapper_data']) && is_array($metadata['wrapper_data'])
                ? $metadata['wrapper_data']
                : [];
            foreach ($responseHeaders as $responseHeader) {
                if (preg_match('/\AHTTP\/\S+\s+([0-9]{3})\b/', (string)$responseHeader, $matches)) {
                    $status = (int)$matches[1];
                }
            }
        } elseif ($streamError !== '') {
            error_log(
                'CLIP Search: ' . $label . ' stream transport failed: '
                . redactSecret($streamError, $secretToRedact)
            );
        }
    }

    return [$status, $response];
}

function validateTurnstile(string $token, string $secret, string $remoteIp, string $host): array
{
    if ($token === '' || strlen($token) > 2048) {
        return ['ok' => false, 'unavailable' => false, 'reason' => 'missing-token'];
    }

    $siteverifyData = [
        'secret' => $secret,
        'response' => $token,
        'idempotency_key' => uuidV4(),
    ];
    if (filter_var($remoteIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
        $siteverifyData['remoteip'] = $remoteIp;
    }
    $body = http_build_query($siteverifyData, '', '&');
    $response = false;
    $transportErrors = [];

    if (function_exists('curl_init')) {
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            list($status, $candidate) = postRequest(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                $body,
                ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
                4,
                10,
                'Turnstile Siteverify'
            );
            if (is_string($candidate) && $candidate !== '' && $status >= 200 && $status < 300) {
                $response = $candidate;
                break;
            }
            $transportErrors[] = 'attempt ' . $attempt . ', HTTP ' . $status;
        }
    } else {
        list($status, $candidate) = postRequest(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            $body,
            ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
            4,
            10,
            'Turnstile Siteverify'
        );
        if (is_string($candidate) && $candidate !== '' && $status >= 200 && $status < 300) {
            $response = $candidate;
        } else {
            $transportErrors[] = 'stream, HTTP ' . $status;
        }
    }

    $result = is_string($response) ? json_decode($response, true) : null;
    if (!is_array($result)) {
        error_log('CLIP Search: Turnstile unavailable. ' . implode(' | ', $transportErrors));
        return ['ok' => false, 'unavailable' => true, 'reason' => 'siteverify-unavailable'];
    }
    if (empty($result['success'])) {
        $errorCodes = isset($result['error-codes']) && is_array($result['error-codes'])
            ? array_values(array_filter($result['error-codes'], 'is_string'))
            : [];
        $reason = $errorCodes !== [] ? implode(',', $errorCodes) : 'siteverify-rejected';
        error_log('CLIP Search: Turnstile rejected token (' . sanitizedLogValue($reason) . ').');
        return ['ok' => false, 'unavailable' => false, 'reason' => $reason];
    }

    if (!requestHostIsLocal()) {
        if (!isset($result['action']) || (string)$result['action'] !== 'clipsearch_lead') {
            error_log('CLIP Search: Turnstile action mismatch.');
            return ['ok' => false, 'unavailable' => false, 'reason' => 'action-mismatch'];
        }
        if (!isset($result['hostname']) || strtolower((string)$result['hostname']) !== $host) {
            error_log('CLIP Search: Turnstile hostname mismatch.');
            return ['ok' => false, 'unavailable' => false, 'reason' => 'hostname-mismatch'];
        }
    }

    return ['ok' => true, 'unavailable' => false, 'reason' => 'verified'];
}

function sendRelayMessage(string $relayUrl, string $relaySecret, string $text, int $connectTimeout, int $timeout): bool
{
    $relayHost = parse_url($relayUrl, PHP_URL_HOST);
    if (filter_var($relayUrl, FILTER_VALIDATE_URL) === false
        || strtolower((string)parse_url($relayUrl, PHP_URL_SCHEME)) !== 'https'
        || !is_string($relayHost)
        || $relayHost === '') {
        error_log('CLIP Search: TELEGRAM_RELAY_URL must be a valid HTTPS URL.');
        return false;
    }
    if (strlen($relaySecret) < 32) {
        error_log('CLIP Search: TELEGRAM_RELAY_SECRET must contain at least 32 characters.');
        return false;
    }

    $body = json_encode(['text' => $text], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($body)) {
        error_log('CLIP Search: relay payload could not be encoded.');
        return false;
    }
    $timestamp = (string)time();
    $signature = hash_hmac('sha256', $timestamp . '.' . $body, $relaySecret);
    list($status, $response) = postRequest(
        $relayUrl,
        $body,
        [
            'Accept: application/json',
            'Content-Type: application/json; charset=UTF-8',
            'X-Clipsearch-Timestamp: ' . $timestamp,
            'X-Clipsearch-Signature: v1=' . $signature,
        ],
        $connectTimeout,
        $timeout,
        'Telegram relay',
        $relaySecret
    );

    $result = is_string($response) ? json_decode($response, true) : null;
    $success = $status >= 200 && $status < 300 && is_array($result) && !empty($result['ok']);
    if (!$success) {
        $code = is_array($result) && isset($result['code'])
            ? sanitizedLogValue((string)$result['code'], 100)
            : 'invalid-response';
        error_log('CLIP Search: Telegram relay failed (HTTP ' . $status . ', ' . $code . ').');
    }
    return $success;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Метод не поддерживается.', 405, $wantsJson, 'method_not_allowed');
}

$host = requestHost();
if ($host === '') {
    respond(false, 'Запрос заблокирован. Обновите страницу и попробуйте снова.', 403, $wantsJson, 'invalid_origin');
}
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $originHost = parse_url((string)$_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    if (!is_string($originHost) || strtolower($originHost) !== $host) {
        respond(false, 'Запрос заблокирован. Обновите страницу и попробуйте снова.', 403, $wantsJson, 'invalid_origin');
    }
}

if (!empty($_POST['website'])) {
    respond(true, 'Заявка принята.', 200, $wantsJson, 'sent');
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$company = trim((string)($_POST['company'] ?? ''));
$source = trim((string)($_POST['source'] ?? ''));
$consent = (string)($_POST['consent'] ?? '') === '1';

foreach ([$name, $phone, $email, $company, $source] as $field) {
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $field)) {
        respond(false, 'Проверьте введённые данные.', 422, $wantsJson, 'invalid_fields');
    }
}

if ($name === '' || $phone === '' || $email === '' || $company === '' || !$consent) {
    respond(false, 'Заполните все поля и подтвердите согласие.', 422, $wantsJson, 'invalid_fields');
}
if (strlen($name) > 120 || strlen($phone) > 60 || strlen($email) > 190 || strlen($company) > 190) {
    respond(false, 'Одно из полей заполнено слишком длинным текстом.', 422, $wantsJson, 'invalid_fields');
}

$source = (string)preg_replace('/\s+/u', ' ', $source);
if ($source === '') {
    $source = 'Источник не определён';
}
if (strlen($source) > 240) {
    respond(false, 'Некорректный источник заявки.', 422, $wantsJson, 'invalid_fields');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Проверьте адрес электронной почты.', 422, $wantsJson, 'invalid_email');
}
$phoneDigits = (string)preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) < 7) {
    respond(false, 'Проверьте номер телефона.', 422, $wantsJson, 'invalid_phone');
}

$turnstileSecret = trim((string)(getenv('TURNSTILE_SECRET_KEY') ?: ''));
if ($turnstileSecret === '' && requestHostIsLocal()) {
    $turnstileSecret = '1x0000000000000000000000000000000AA';
}
if ($turnstileSecret === '') {
    error_log('CLIP Search: TURNSTILE_SECRET_KEY is not configured.');
    respond(false, 'Форма временно недоступна. Позвоните нам или попробуйте позже.', 503, $wantsJson, 'captcha_config');
}

$turnstileToken = trim((string)($_POST['cf-turnstile-response'] ?? ''));
$remoteIp = trim((string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
$turnstile = validateTurnstile($turnstileToken, $turnstileSecret, $remoteIp, $host);
if (!$turnstile['ok']) {
    if ($turnstile['unavailable']) {
        respond(false, 'Антиспам-проверка временно недоступна. Попробуйте позже.', 503, $wantsJson, 'captcha_unavailable');
    }
    respond(false, 'Не удалось выполнить антиспам-проверку. Обновите её и попробуйте ещё раз.', 422, $wantsJson, 'captcha_failed');
}

$relayUrl = trim((string)(getenv('TELEGRAM_RELAY_URL') ?: ''));
$relaySecret = trim((string)(getenv('TELEGRAM_RELAY_SECRET') ?: ''));
if ($relayUrl === '' || $relaySecret === '') {
    error_log('CLIP Search: TELEGRAM_RELAY_URL or TELEGRAM_RELAY_SECRET is not configured.');
    respond(false, 'Сервис заявок временно недоступен. Позвоните нам или попробуйте позже.', 503, $wantsJson, 'delivery_config');
}

$connectTimeout = max(2, (int)(getenv('TELEGRAM_CONNECT_TIMEOUT') ?: 5));
$timeout = max(3, (int)(getenv('TELEGRAM_TIMEOUT') ?: 12));
$requestId = date('Ymd-His') . '-' . strtoupper(substr(hash('sha256', microtime(true) . '|' . $remoteIp), 0, 8));
$submittedAt = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
$pageUrl = trim((string)($_SERVER['HTTP_REFERER'] ?? ''));
$message = "🔴 Новая заявка CLIP Search\n\n"
    . 'ID заявки: ' . $requestId . "\n"
    . 'Имя: ' . sanitizedLogValue($name, 120) . "\n"
    . 'Телефон: ' . sanitizedLogValue($phone, 60) . "\n"
    . 'Почта: ' . sanitizedLogValue($email, 190) . "\n"
    . 'Компания: ' . sanitizedLogValue($company, 190) . "\n"
    . 'Кнопка / источник: ' . sanitizedLogValue($source, 240) . "\n"
    . 'Страница: ' . ($pageUrl !== '' ? sanitizedLogValue($pageUrl, 500) : '—') . "\n"
    . 'Время: ' . $submittedAt->format('d.m.Y H:i:s') . ' МСК';

if (!sendRelayMessage($relayUrl, $relaySecret, $message, $connectTimeout, $timeout)) {
    respond(false, 'Не удалось отправить заявку. Позвоните нам или попробуйте позже.', 502, $wantsJson, 'delivery_failed');
}

respond(true, 'Заявка принята.', 200, $wantsJson, 'sent');
