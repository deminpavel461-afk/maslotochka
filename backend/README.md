# Backend — Маслоточка

PHP 8.3, один endpoint: `POST /api/booking`. Заявки в SQLite (`bookings.db`).

## Требования

- PHP ≥ 8.3
- Расширения: `pdo_sqlite`, `mbstring`

## Локальный запуск

1. Скопируйте конфиг:

```bash
cp .env.example .env
```

2. В `.env` укажите origin фронта (Vite по умолчанию):

```env
ALLOWED_ORIGIN=http://localhost:5173
```

3. Из корня репозитория поднимите встроенный сервер так, чтобы `/api/booking` указывал на `backend/api/booking.php`:

```bash
php -S localhost:8080 -t . backend/router.php
```

Либо вызывайте файл напрямую:

```bash
php -S localhost:8080 -t backend/api
# тогда URL: http://localhost:8080/booking.php
```

4. Фронт: в `frontend` задайте `VITE_API_URL=http://localhost:8080/api/booking` (подключится в задаче формы).

## Graceful fallback (без JS)

Нативный `POST` (`application/x-www-form-urlencoded`) получает HTML-страницу
подтверждения или список ошибок. JSON-ответ — только для `Content-Type: application/json`
(форма React через `fetch`).

В `frontend/index.html` внутри `#root` лежит статическая форма: при отключённом JS
она остаётся на странице; при загрузке React содержимое `#root` заменяется приложением.

## Приёмка (спека §4)

Нативный PHP на Windows может быть недоступен. Мини-скрипт:

```bash
node --experimental-sqlite backend/scripts/acceptance-booking.mjs
```

Он аудитит `api/booking.php` и прогоняет 201/422/honeypot/CORS на twin-сервере
с тем же контрактом. Когда PHP установлен, дополнительно:

```bash
php -S localhost:8080 -t . backend/router.php
# в другом окне
powershell -File backend/scripts/acceptance-booking.ps1
```

## Проверка endpoint

Успех (201):

```bash
curl -i -X POST http://localhost:8080/api/booking \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "{\"name\":\"Иван\",\"phone\":\"+79001234567\",\"car\":\"Toyota Camry\",\"datetime\":\"2030-01-15T10:00\",\"consent\":true}"
```

Ожидаемое тело: `{"id":"МТ-0001","status":"ok"}`.

Honeypot (200, без записи в БД):

```bash
curl -i -X POST http://localhost:8080/api/booking \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Иван\",\"phone\":\"+79001234567\",\"car\":\"Toyota Camry\",\"datetime\":\"2030-01-15T10:00\",\"consent\":true,\"website\":\"http://spam.test\"}"
```

Валидация (422): отправьте пустое имя или телефон без `+7`.

## Деплой на shared-хостинг

- Каталог `backend/` — на сервер (вне публичного document root по возможности).
- `public/` — сборка фронта.
- Настройте rewrite/`Alias`, чтобы `POST /api/booking` выполнял `backend/api/booking.php`.
- Создайте `.env` из `.env.example` с боевым `ALLOWED_ORIGIN`.
- Убедитесь, что PHP может писать файл `bookings.db` (или путь из `DB_PATH`).

## Схема `bookings`

| Поле        | Тип     |
|-------------|---------|
| id          | INTEGER PK AI |
| name        | TEXT    |
| phone       | TEXT    |
| car         | TEXT    |
| datetime    | TEXT    |
| comment     | TEXT NULL |
| created_at  | TEXT (ISO-8601 UTC) |
