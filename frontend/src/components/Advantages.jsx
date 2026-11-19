import styles from './Advantages.module.css';

const items = [
  {
    text: 'Работаем без записи — принимаем в порядке живой очереди',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    text: 'Соблюдаем регламент автопроизводителя по объёму и вязкости',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    text: 'Утилизируем старое масло по нормам',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v6l3 2" />
        <path d="M7 10.5C7 7.5 9.2 5 12 5s5 2.5 5 5.5c0 4-5 9.5-5 9.5S7 14.5 7 10.5z" />
        <path d="M9.5 11.5h5" />
      </svg>
    ),
  },
  {
    text: 'Гарантия на работы и материалы',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" />
        <path d="M9.5 12.5l2 2 3.5-3.5" />
      </svg>
    ),
  },
];

export default function Advantages() {
  return (
    <section id="advantages" className={styles.section} aria-labelledby="advantages-title">
      <div className={styles.inner}>
        <h2 id="advantages-title">Преимущества</h2>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.text} className={styles.item}>
              <span className={styles.icon}>{item.icon}</span>
              <p className={styles.text}>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
