import styles from './Trust.module.css';
import equip1 from '../assets/equip-1.webp';
import equip2 from '../assets/equip-2.webp';

const partners = ['Castrol', 'Mobil', 'Shell', 'Liqui Moly'];

const reviewSlots = [
  { id: 'review-1' },
  { id: 'review-2' },
  { id: 'review-3' },
];

const equipmentShots = [
  { src: equip1, label: 'Фото оборудования — плейсхолдер 1' },
  { src: equip2, label: 'Фото оборудования — плейсхолдер 2' },
];

export default function Trust() {
  return (
    <section id="trust" className={styles.section} aria-labelledby="trust-title">
      <div className={styles.inner}>
        <h2 id="trust-title">Почему нам доверяют</h2>

        <div className={styles.partners}>
          <p className={styles.lead}>Партнёрство с брендами масел</p>
          <ul className={styles.partnerList}>
            {partners.map((name) => (
              <li key={name} className={styles.partner}>
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.equipment} aria-label="Фото оборудования">
          {equipmentShots.map((shot) => (
            <figure key={shot.label} className={styles.equipShot}>
              <img
                src={shot.src}
                alt={shot.label}
                width="1200"
                height="800"
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>

        <h3 className={styles.subheading}>Отзывы</h3>
        <ul className={styles.reviews}>
          {reviewSlots.map((slot, index) => (
            <li key={slot.id} className={styles.review}>
              <div className={styles.avatar} aria-hidden="true">
                Фото
              </div>
              <p className={styles.reviewName}>Имя — плейсхолдер {index + 1}</p>
              <p className={styles.reviewCar}>Марка авто — плейсхолдер</p>
              <p className={styles.reviewText}>
                Текст отзыва появится после подтверждения брифа. Сочинять отзывы от
                имени реальных людей нельзя.
              </p>
            </li>
          ))}
        </ul>

        <aside className={styles.guarantees} aria-label="Гарантии">
          <p>Гарантия на работы — 6 месяцев или до следующего ТО</p>
          <p>Возврат старого фильтра по запросу</p>
        </aside>
      </div>
    </section>
  );
}
