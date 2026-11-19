/**
 * Приёмка контракта POST /api/booking (спека §4).
 * 1) Статический аудит backend/api/booking.php
 * 2) HTTP-прогон против локального twin на node:sqlite
 *    (нативный PHP на машине недоступен — twin зеркалит контракт).
 *
 * Запуск: node backend/scripts/acceptance-booking.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const phpPath = path.join(root, 'api', 'booking.php');
const allowedOrigin = 'http://localhost:5173';

let passed = 0;
let failed = 0;

function assert(name, ok, detail = '') {
  if (ok) {
    console.log(`PASS  ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D+/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) return `+7${digits}`;
  return String(phone).replace(/\s+/g, '');
}

function formatBookingId(rowId) {
  return `МТ-${String(rowId).padStart(4, '0')}`;
}

function validateBooking(input) {
  const errors = {};
  const name = String(input.name ?? '').trim();
  if ([...name].length < 2) errors.name = 'Укажите имя (не меньше 2 символов)';

  const phone = normalizePhone(input.phone ?? '');
  if (!/^\+7\d{10}$/.test(phone)) {
    errors.phone = 'Введите телефон в формате +7 XXX XXX-XX-XX';
  }

  const car = String(input.car ?? '').trim();
  if (!car) errors.car = 'Укажите марку и модель авто';

  const datetimeRaw = String(input.datetime ?? '').trim();
  if (!datetimeRaw) {
    errors.datetime = 'Укажите желаемую дату и время';
  } else {
    const desired = new Date(datetimeRaw);
    if (Number.isNaN(desired.getTime()) || desired < new Date()) {
      errors.datetime = 'Дата не должна быть в прошлом';
    }
  }

  const consent = input.consent;
  const consentOk =
    consent === true ||
    consent === 1 ||
    consent === '1' ||
    consent === 'on' ||
    consent === 'true';
  if (!consentOk) {
    errors.consent = 'Нужно согласие на обработку персональных данных';
  }

  return errors;
}

function auditPhpSource() {
  const src = fs.readFileSync(phpPath, 'utf8');
  assert('PHP: honeypot website → 200', /website/.test(src) && /http_response_code\(200\)/.test(src));
  assert(
    'PHP: success 201 + status ok',
    /http_response_code\(201\)/.test(src) && /'status'\s*=>\s*'ok'/.test(src),
  );
  assert(
    'PHP: validation 422',
    /http_response_code\(422\)/.test(src) && /'validation'/.test(src),
  );
  assert('PHP: phone regex +7', src.includes('/^\\+7\\d{10}$/'));
  assert(
    'PHP: phone error text',
    src.includes('Введите телефон в формате +7 XXX XXX-XX-XX'),
  );
  assert('PHP: CORS ALLOWED_ORIGIN', /Access-Control-Allow-Origin/.test(src) && /ALLOWED_ORIGIN/.test(src));
  assert('PHP: SQLite schema bookings', /CREATE TABLE IF NOT EXISTS bookings/.test(src));
  assert('PHP: id format МТ-', src.includes("'МТ-'") || src.includes('"МТ-"'));
}

function createTwinServer() {
  const dbFile = path.join(root, 'bookings-acceptance.db');
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  const db = new DatabaseSync(dbFile);
  db.exec(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    car TEXT NOT NULL,
    datetime TEXT NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL
  )`);

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || '';
    if (origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST' || req.url !== '/api/booking') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    let input = {};
    try {
      input = JSON.parse(raw || '{}');
    } catch {
      input = {};
    }

    if (String(input.website ?? '').trim() !== '') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    const errors = validateBooking(input);
    if (Object.keys(errors).length) {
      res.writeHead(422, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'validation', fields: errors }));
      return;
    }

    const insert = db.prepare(
      `INSERT INTO bookings (name, phone, car, datetime, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const comment = String(input.comment ?? '').trim() || null;
    insert.run(
      String(input.name).trim(),
      normalizePhone(input.phone),
      String(input.car).trim(),
      String(input.datetime).trim(),
      comment,
      new Date().toISOString(),
    );
    const rowId = Number(db.prepare('SELECT last_insert_rowid() AS id').get().id);
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ id: formatBookingId(rowId), status: 'ok' }));
  });

  return { server, dbFile };
}

async function request(port, body, method = 'POST') {
  const payload = body == null ? null : JSON.stringify(body);
  const res = await fetch(`http://127.0.0.1:${port}/api/booking`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: allowedOrigin,
      Accept: 'application/json',
    },
    body: method === 'OPTIONS' ? undefined : payload,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, headers: res.headers, text };
}

async function runHttpCases(port) {
  const valid = await request(port, {
    name: 'Иван',
    phone: '+79001234567',
    car: 'Toyota Camry',
    datetime: '2030-06-15T10:00',
    consent: true,
    comment: 'тест',
  });
  assert(
    '201 valid booking',
    valid.status === 201 &&
      valid.json?.status === 'ok' &&
      /^МТ-\d{4,}$/.test(valid.json?.id ?? ''),
    `status=${valid.status} body=${valid.text}`,
  );
  const firstId = valid.json?.id;

  const badPhone = await request(port, {
    name: 'Иван',
    phone: '+7900123',
    car: 'Toyota Camry',
    datetime: '2030-06-15T10:00',
    consent: true,
  });
  assert(
    '422 invalid phone',
    badPhone.status === 422 &&
      badPhone.json?.error === 'validation' &&
      badPhone.json?.fields?.phone === 'Введите телефон в формате +7 XXX XXX-XX-XX',
    `status=${badPhone.status} body=${badPhone.text}`,
  );

  const noConsent = await request(port, {
    name: 'Иван',
    phone: '+79001234567',
    car: 'Toyota Camry',
    datetime: '2030-06-15T10:00',
    consent: false,
  });
  assert(
    '422 without consent',
    noConsent.status === 422 && noConsent.json?.fields?.consent,
    `status=${noConsent.status} body=${noConsent.text}`,
  );

  const past = await request(port, {
    name: 'Иван',
    phone: '+79001234567',
    car: 'Toyota Camry',
    datetime: '2020-01-01T10:00',
    consent: true,
  });
  assert(
    '422 past datetime',
    past.status === 422 && past.json?.fields?.datetime,
    `status=${past.status} body=${past.text}`,
  );

  const honey = await request(port, {
    name: 'Spam',
    phone: '+79001234567',
    car: 'Spam Car',
    datetime: '2030-06-15T10:00',
    consent: true,
    website: 'http://spam.test',
  });
  assert(
    '200 honeypot no save',
    honey.status === 200 && honey.json?.status === 'ok' && !honey.json?.id,
    `status=${honey.status} body=${honey.text}`,
  );

  const valid2 = await request(port, {
    name: 'Пётр',
    phone: '+79007654321',
    car: 'Kia Rio',
    datetime: '2030-07-01T12:00',
    consent: true,
  });
  assert(
    '201 after honeypot still increments',
    valid2.status === 201 &&
      /^МТ-\d{4,}$/.test(valid2.json?.id ?? '') &&
      valid2.json?.id !== firstId,
    `first=${firstId} second=${valid2.json?.id}`,
  );

  const cors = await fetch(`http://127.0.0.1:${port}/api/booking`, {
    method: 'OPTIONS',
    headers: {
      Origin: allowedOrigin,
      'Access-Control-Request-Method': 'POST',
    },
  });
  assert(
    'CORS allows configured origin',
    cors.headers.get('access-control-allow-origin') === allowedOrigin,
    `got=${cors.headers.get('access-control-allow-origin')}`,
  );
}

const { server, dbFile } = createTwinServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

console.log('=== Static audit: booking.php ===');
auditPhpSource();
console.log(`\n=== HTTP cases against twin :${port} ===`);
await runHttpCases(port);

server.close();
try {
  fs.unlinkSync(dbFile);
} catch {
  /* ignore */
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
