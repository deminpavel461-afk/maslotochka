import styles from './Locations.module.css';

const PHONE_DISPLAY = '+7 (812) XXX-XX-XX';
const PHONE_TEL = '+78120000000';
const PHONE_DIGITS = '78120000000';

const points = [
  {
    id: 'energetikov',
    address: 'пр. Энергетиков, 10',
    hours: 'ежедневно 09:00–21:00',
    lat: 59.9386,
    lon: 30.4394,
  },
  {
    id: 'moskovsky',
    address: 'Московский пр., 220',
    hours: 'ежедневно 09:00–21:00',
    lat: 59.8497,
    lon: 30.3215,
  },
];

const mapSrc =
  'https://yandex.ru/map-widget/v1/?ll=30.3800%2C59.8940&z=11&l=map' +
  `&pt=${points.map((p) => `${p.lon},${p.lat},pm2rdm`).join('~')}`;

function MessengerIcon({ type }) {
  if (type === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.15 6.37 2.15 11.75c0 1.92.56 3.71 1.53 5.23L2 22l5.2-1.63a10.1 10.1 0 0 0 4.84 1.23h.01c5.46 0 9.89-4.37 9.89-9.75S17.5 2 12.04 2zm5.76 13.99c-.24.67-1.4 1.23-1.95 1.31-.5.07-1.13.1-1.82-.11-.42-.13-.96-.28-1.65-.55-2.9-1.26-4.78-4.18-4.93-4.38-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.19-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.29.29-.12.56.17.28.74 1.22 1.59 1.98 1.1.98 2.02 1.28 2.3 1.42.29.14.45.12.62-.07.17-.19.72-.84.91-1.13.19-.28.39-.24.66-.14.27.1 1.72.81 2.02.96.29.14.49.22.56.34.07.12.07.7-.17 1.37z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.57 7.4c-.12.54-.43.67-.87.42l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.49.24l.17-2.45 4.47-4.04c.19-.17-.04-.27-.3-.1l-5.52 3.48-2.38-.74c-.52-.16-.53-.52.11-.77l9.3-3.58c.43-.16.81.1.64.79z" />
    </svg>
  );
}

export default function Locations() {
  return (
    <section id="locations" className={styles.section} aria-labelledby="locations-title">
      <div className={styles.inner}>
        <h2 id="locations-title">Локации и контакты</h2>

        <div className={styles.mapWrap}>
          <iframe
            className={styles.map}
            title="Точки Маслоточки на Яндекс Картах"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <ul className={styles.points}>
          {points.map((point) => {
            const routeUrl = `https://yandex.ru/maps/?rtext=~${point.lat},${point.lon}&rtt=auto`;
            const whatsappUrl = `https://wa.me/${PHONE_DIGITS}`;
            /* Telegram-username-заглушка — заменить на реальный канал/аккаунт */
            const telegramUrl = 'https://t.me/maslotochka';

            return (
              <li key={point.id} className={styles.point}>
                <h3 className={styles.address}>{point.address}</h3>
                <p className={styles.hours}>{point.hours}</p>
                <a className={styles.phone} href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>

                <div className={styles.actions}>
                  <a
                    className={styles.messenger}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessengerIcon type="whatsapp" />
                    WhatsApp
                  </a>
                  <a
                    className={styles.messenger}
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessengerIcon type="telegram" />
                    Telegram
                  </a>
                  <a
                    className={styles.route}
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Построить маршрут
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
