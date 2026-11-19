<?php
declare(strict_types=1);

/**
 * POST /api/booking — приём заявок на замену масла.
 * Контракт: specs/001-landing.md §4, AGENTS.md.
 * JSON — для fetch; HTML — graceful fallback без JS.
 */

$root = dirname(__DIR__);
$config = loadEnv($root . DIRECTORY_SEPARATOR . '.env');

$allowedOrigin = $config['ALLOWED_ORIGIN'] ?? '';
$dbPath = $config['DB_PATH'] ?? ($root . DIRECTORY_SEPARATOR . 'bookings.db');
$wantsHtml = wantsHtmlResponse();

applyCors($allowedOrigin);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondError($wantsHtml, 405, ['error' => 'method_not_allowed'], 'Метод не поддерживается');
}

$input = readInput();

// Honeypot: заполненное website → 200 без сохранения
$honeypot = trim((string) ($input['website'] ?? ''));
if ($honeypot !== '') {
    if ($wantsHtml) {
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        echo renderHtmlPage('Заявка принята', '<p>Спасибо! Мы свяжемся с вами.</p><p><a href="/">На главную</a></p>');
        exit;
    }
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(200);
    echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
    exit;
}

$errors = validateBooking($input);
if ($errors !== []) {
    if ($wantsHtml) {
        http_response_code(422);
        header('Content-Type: text/html; charset=utf-8');
        $list = '<ul>';
        foreach ($errors as $message) {
            $list .= '<li>' . htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>';
        }
        $list .= '</ul>';
        echo renderHtmlPage(
            'Проверьте данные',
            '<p>Не удалось принять заявку:</p>' . $list . '<p><a href="/#booking">Вернуться к форме</a></p>'
        );
        exit;
    }
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(422);
    echo json_encode([
        'error' => 'validation',
        'fields' => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = openDatabase($dbPath);
    ensureSchema($pdo);

    $stmt = $pdo->prepare(
        'INSERT INTO bookings (name, phone, car, datetime, comment, created_at)
         VALUES (:name, :phone, :car, :datetime, :comment, :created_at)'
    );

    $createdAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DateTimeInterface::ATOM);
    $comment = trim((string) ($input['comment'] ?? ''));
    $comment = $comment === '' ? null : $comment;

    $stmt->execute([
        ':name' => trim((string) $input['name']),
        ':phone' => normalizePhone((string) $input['phone']),
        ':car' => trim((string) $input['car']),
        ':datetime' => trim((string) $input['datetime']),
        ':comment' => $comment,
        ':created_at' => $createdAt,
    ]);

    $rowId = (int) $pdo->lastInsertId();
    $publicId = formatBookingId($rowId);

    if ($wantsHtml) {
        http_response_code(201);
        header('Content-Type: text/html; charset=utf-8');
        $safeId = htmlspecialchars($publicId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        echo renderHtmlPage(
            'Заявка принята',
            '<p>Заявка №' . $safeId . ' принята, перезвоним в течение 15 минут</p>' .
            '<p><a href="/">На главную</a></p>'
        );
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    http_response_code(201);
    echo json_encode([
        'id' => $publicId,
        'status' => 'ok',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    respondError($wantsHtml, 500, ['error' => 'server_error'], 'Серверная ошибка. Позвоните нам или попробуйте позже.');
}

// --- helpers ---

function wantsHtmlResponse(): bool
{
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    if (str_contains($contentType, 'application/json')) {
        return false;
    }

    $accept = strtolower($_SERVER['HTTP_ACCEPT'] ?? '');
    if (str_contains($accept, 'application/json') && !str_contains($accept, 'text/html')) {
        return false;
    }

    // Нативный submit браузера: form-urlencoded / multipart + Accept text/html
    if (
        str_contains($contentType, 'application/x-www-form-urlencoded')
        || str_contains($contentType, 'multipart/form-data')
        || $contentType === ''
    ) {
        return true;
    }

    return str_contains($accept, 'text/html');
}

function respondError(bool $wantsHtml, int $status, array $jsonBody, string $htmlMessage): void
{
    http_response_code($status);
    if ($wantsHtml) {
        header('Content-Type: text/html; charset=utf-8');
        echo renderHtmlPage(
            'Ошибка',
            '<p>' . htmlspecialchars($htmlMessage, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>' .
            '<p><a href="/#booking">Вернуться к форме</a></p>'
        );
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($jsonBody, JSON_UNESCAPED_UNICODE);
    exit;
}

function renderHtmlPage(string $title, string $bodyHtml): string
{
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return '<!doctype html><html lang="ru"><head><meta charset="UTF-8">' .
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' .
        '<title>' . $safeTitle . ' — Маслоточка</title>' .
        '<style>body{font-family:system-ui,sans-serif;line-height:1.5;max-width:36rem;margin:2rem auto;padding:0 1.25rem}</style>' .
        '</head><body><h1>' . $safeTitle . '</h1>' . $bodyHtml . '</body></html>';
}

function loadEnv(string $path): array
{
    if (!is_readable($path)) {
        return [];
    }

    $vars = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");
        $vars[$key] = $value;
    }

    return $vars;
}

function applyCors(string $allowedOrigin): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($allowedOrigin !== '' && $origin === $allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Max-Age: 86400');
    }
}

function readInput(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

    if (str_contains(strtolower($contentType), 'application/json')) {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    return $_POST;
}

function validateBooking(array $input): array
{
    $errors = [];

    $name = trim((string) ($input['name'] ?? ''));
    if (mb_strlen($name) < 2) {
        $errors['name'] = 'Укажите имя (не меньше 2 символов)';
    }

    $phone = normalizePhone((string) ($input['phone'] ?? ''));
    if (!preg_match('/^\+7\d{10}$/', $phone)) {
        $errors['phone'] = 'Введите телефон в формате +7 XXX XXX-XX-XX';
    }

    $car = trim((string) ($input['car'] ?? ''));
    if ($car === '') {
        $errors['car'] = 'Укажите марку и модель авто';
    }

    $datetimeRaw = trim((string) ($input['datetime'] ?? ''));
    if ($datetimeRaw === '') {
        $errors['datetime'] = 'Укажите желаемую дату и время';
    } else {
        try {
            $desired = new DateTimeImmutable($datetimeRaw);
            $now = new DateTimeImmutable('now');
            if ($desired < $now) {
                $errors['datetime'] = 'Дата не должна быть в прошлом';
            }
        } catch (Exception $e) {
            $errors['datetime'] = 'Некорректная дата и время';
        }
    }

    $consent = $input['consent'] ?? false;
    $consentOk = $consent === true
        || $consent === 1
        || $consent === '1'
        || $consent === 'on'
        || $consent === 'true';
    if (!$consentOk) {
        $errors['consent'] = 'Нужно согласие на обработку персональных данных';
    }

    return $errors;
}

function normalizePhone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';

    if (strlen($digits) === 11 && ($digits[0] === '7' || $digits[0] === '8')) {
        return '+7' . substr($digits, 1);
    }

    if (strlen($digits) === 10) {
        return '+7' . $digits;
    }

    $trimmed = preg_replace('/\s+/', '', $phone) ?? '';
    return $trimmed;
}

function openDatabase(string $dbPath): PDO
{
    $dir = dirname($dbPath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function ensureSchema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            car TEXT NOT NULL,
            datetime TEXT NOT NULL,
            comment TEXT,
            created_at TEXT NOT NULL
        )'
    );
}

function formatBookingId(int $rowId): string
{
    return 'МТ-' . str_pad((string) $rowId, 4, '0', STR_PAD_LEFT);
}
