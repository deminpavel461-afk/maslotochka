import styles from './Footer.module.css';

const PHONE_DISPLAY = '+7 (812) XXX-XX-XX';
const PHONE_TEL = '+78120000000';

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer} aria-labelledby="footer-title">
      <div className={styles.inner}>
        <h2 id="footer-title" className="visually-hidden">
          Контакты и юридическая информация
        </h2>

        <div className={styles.grid}>
          <div>
            <p className={styles.brand}>Маслоточка</p>
            <p className={styles.legal}>
              ИП/ООО — уточнить у клиента
              <br />
              ИНН — уточнить у клиента
              <br />
              Адрес — уточнить у клиента
            </p>
            <p className={styles.contacts}>
              <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
            </p>
          </div>

          <div>
            <p className={styles.label}>Документы</p>
            <ul className={styles.links}>
              <li>
                <a href="/privacy.html">Политика конфиденциальности</a>
              </li>
              <li>
                <a href="/offer.html">Оферта</a>
              </li>
            </ul>
          </div>

          <div>
            <p className={styles.label}>Мы на картах</p>
            <ul className={styles.links}>
              <li>
                <a
                  href="https://yandex.ru/maps/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Яндекс Карты
                </a>
              </li>
              <li>
                <a
                  href="https://2gis.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  2ГИС
                </a>
              </li>
              <li>
                <a
                  href="https://www.avito.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Авито Услуги
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className={styles.copy}>Маслоточка, 2026</p>
      </div>
    </footer>
  );
}
