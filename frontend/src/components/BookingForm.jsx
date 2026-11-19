import { useState } from 'react';
import styles from './BookingForm.module.css';

const PHONE_DISPLAY = '+7 (812) XXX-XX-XX';
const PHONE_TEL = '+78120000000';
const PHONE_RE = /^\+7\d{10}$/;
const API_URL = import.meta.env.VITE_API_URL || '/api/booking';
const PHONE_ERROR = 'Введите телефон в формате +7 XXX XXX-XX-XX';

function formatPhoneMask(raw) {
  const digits = raw.replace(/\D/g, '');
  let rest = digits;

  if (rest.startsWith('7') || rest.startsWith('8')) {
    rest = rest.slice(1);
  }
  rest = rest.slice(0, 10);

  let result = '+7';
  if (rest.length > 0) result += ' ' + rest.slice(0, 3);
  if (rest.length > 3) result += ' ' + rest.slice(3, 6);
  if (rest.length > 6) result += '-' + rest.slice(6, 8);
  if (rest.length > 8) result += '-' + rest.slice(8, 10);
  return result;
}

function toE164(masked) {
  const digits = masked.replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  return '+7';
}

function validateClient({ name, phoneE164, car, datetime }) {
  const fields = {};

  if (name.trim().length < 2) {
    fields.name = 'Укажите имя (не меньше 2 символов)';
  }

  if (!PHONE_RE.test(phoneE164)) {
    fields.phone = PHONE_ERROR;
  }

  if (car.trim() === '') {
    fields.car = 'Укажите марку и модель авто';
  }

  if (!datetime) {
    fields.datetime = 'Укажите желаемую дату и время';
  } else {
    const desired = new Date(datetime);
    if (Number.isNaN(desired.getTime()) || desired < new Date()) {
      fields.datetime = 'Дата не должна быть в прошлом';
    }
  }

  return fields;
}

export default function BookingForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+7');
  const [car, setCar] = useState('');
  const [datetime, setDatetime] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  const canSubmit = consent && !submitting;

  function clearFieldError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handlePhoneChange(event) {
    setPhone(formatPhoneMask(event.target.value));
    clearFieldError('phone');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const phoneE164 = toE164(phone);
    const clientErrors = validateClient({ name, phoneE164, car, datetime });

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFormError('');
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneE164,
          car: car.trim(),
          datetime,
          comment: comment.trim(),
          consent: true,
          website,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 201 && data.status === 'ok' && data.id) {
        setBookingId(data.id);
        return;
      }

      if (response.status === 422 && data.error === 'validation' && data.fields) {
        setErrors(data.fields);
        return;
      }

      setFormError('Не удалось отправить заявку. Позвоните нам или попробуйте позже.');
    } catch {
      setFormError('Не удалось отправить заявку. Позвоните нам или попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="booking" className={styles.section} aria-labelledby="booking-title">
      <div className={styles.inner}>
        <h2 id="booking-title">Запись онлайн</h2>

        <div className={styles.layout}>
          {bookingId ? (
            <div className={styles.success} role="status" aria-live="polite">
              <p>
                Заявка №{bookingId} принята, перезвоним в течение 15 минут
              </p>
            </div>
          ) : (
            <form
              className={styles.form}
              method="post"
              action={API_URL}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="website">Сайт</label>
                <input
                  id="website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                />
                {errors.name ? (
                  <p id="name-error" className={styles.error}>
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="+7 XXX XXX-XX-XX"
                  value={phone}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  onChange={handlePhoneChange}
                />
                {errors.phone ? (
                  <p id="phone-error" className={styles.error}>
                    {errors.phone}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="car">Марка и модель авто</label>
                <input
                  id="car"
                  name="car"
                  type="text"
                  required
                  value={car}
                  aria-invalid={Boolean(errors.car)}
                  aria-describedby={errors.car ? 'car-error' : undefined}
                  onChange={(e) => {
                    setCar(e.target.value);
                    clearFieldError('car');
                  }}
                />
                {errors.car ? (
                  <p id="car-error" className={styles.error}>
                    {errors.car}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="datetime">Желаемые дата и время</label>
                <input
                  id="datetime"
                  name="datetime"
                  type="datetime-local"
                  required
                  value={datetime}
                  aria-invalid={Boolean(errors.datetime)}
                  aria-describedby={errors.datetime ? 'datetime-error' : undefined}
                  onChange={(e) => {
                    setDatetime(e.target.value);
                    clearFieldError('datetime');
                  }}
                />
                {errors.datetime ? (
                  <p id="datetime-error" className={styles.error}>
                    {errors.datetime}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="comment">Комментарий (необязательно)</label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="consent"
                  value="1"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Согласие на обработку{' '}
                  <a href="/privacy.html">персональных данных</a>
                </span>
              </label>
              {errors.consent ? (
                <p className={styles.error}>{errors.consent}</p>
              ) : null}

              {formError ? (
                <p className={styles.formError} role="alert">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                className={styles.submit}
                data-cta="form"
                disabled={!canSubmit}
              >
                {submitting ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </form>
          )}

          <p className={styles.call}>
            Или позвоните:{' '}
            <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
