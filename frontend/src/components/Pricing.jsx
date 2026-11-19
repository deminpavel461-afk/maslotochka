import styles from './Pricing.module.css';

const rows = [
  { service: 'Замена масла ДВС + фильтр', car: 'от 1500 ₽', suv: 'от 1800 ₽' },
  { service: 'Замена масла в АКПП (частичная)', car: 'от 3500 ₽', suv: 'от 4000 ₽' },
  { service: 'Замена жидкости ГУР', car: 'от 1200 ₽', suv: 'от 1500 ₽' },
  { service: 'Замена тормозной жидкости', car: 'от 1300 ₽', suv: 'от 1500 ₽' },
  { service: 'Промывка системы смазки', car: 'от 1000 ₽', suv: 'от 1200 ₽' },
];

export default function Pricing() {
  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-title">
      <div className={styles.inner}>
        <h2 id="pricing-title">Услуги и цены</h2>

        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Таблица цен">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Услуга</th>
                <th scope="col">Легковые</th>
                <th scope="col">SUV и кроссоверы</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.service}>
                  <th scope="row">{row.service}</th>
                  <td>{row.car}</td>
                  <td>{row.suv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.note}>
          Цена включает работу, фильтр и расходные материалы. Масло оплачивается
          отдельно — привозите своё или выберите наше.
        </p>

        <a href="#booking" className={styles.cta} data-cta="price">
          Записаться онлайн
        </a>
      </div>
    </section>
  );
}
