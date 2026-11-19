import styles from './HowItWorks.module.css';

const steps = [
  {
    title: 'Запись или приезд',
    text: 'можно записаться онлайн или приехать без записи.',
    time: '2 мин',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: 'Диагностика',
    text: 'мастер проверяет уровень и состояние всех жидкостей.',
    time: '5–10 мин',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3M11 8v3l2 1" />
      </svg>
    ),
  },
  {
    title: 'Замена по регламенту',
    text: 'объём и вязкость строго по документам производителя.',
    time: '15–20 мин',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    title: 'Отчёт и рекомендации',
    text: 'выдаём чек, рекомендации по следующему ТО, старый фильтр возвращаем по запросу.',
    time: '5 мин',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="how-title">
      <div className={styles.inner}>
        <h2 id="how-title">Как это работает</h2>

        <ol className={styles.timeline}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.rail} aria-hidden="true">
                <span className={styles.marker}>
                  <span className={styles.icon}>{step.icon}</span>
                </span>
                {index < steps.length - 1 ? <span className={styles.line} /> : null}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.number}>Шаг {index + 1}</span>
                  <span className={styles.time}>{step.time}</span>
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.text}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
