<?php
declare(strict_types=1);

/**
 * Роутер для `php -S localhost:8080 -t . backend/router.php`
 * Проксирует /api/booking → backend/api/booking.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

if ($uri === '/api/booking' || $uri === '/api/booking/') {
    require __DIR__ . '/api/booking.php';
    return true;
}

$file = getcwd() . $uri;
if ($uri !== '/' && is_file($file)) {
    return false;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "Not found\n";
return true;
