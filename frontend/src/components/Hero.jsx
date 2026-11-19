import styles from './Hero.module.css';
import heroImage from '../assets/hero.webp';

export default function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.media} aria-hidden="true">
        <img
          className={styles.image}
          src={heroImage}
          alt=""
          width="1600"
          height="900"
          fetchPriority="high"
          decoding="async"
        />
        <div className={styles.scrim} />
      </div>

      <div className={styles.content}>
        <p className={styles.brand}>Маслоточка</p>
        <h1 id="hero-title">
          Замена масла за 30 минут рядом с вами. Бесплатная диагностика ходовой в
          подарок
        </h1>
        <p className={styles.subtitle}>
          Сеть точек в Санкт-Петербурге. Только проверенные масла: Castrol, Mobil,
          Shell, Liqui Moly — под регламент вашего авто.
        </p>
        <div className={styles.actions}>
          <a href="#booking" className={styles.primary} data-cta="hero">
            Записаться онлайн
          </a>
          <a href="#locations" className={styles.secondary} data-cta="map">
            Выбрать точку на карте
          </a>
        </div>
      </div>
    </section>
  );
}
