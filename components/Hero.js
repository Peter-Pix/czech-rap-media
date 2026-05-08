import Link from 'next/link'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        {/* decorative elements */}
        <div className={styles.dot} aria-hidden />
        <div className={styles.squareDeco} aria-hidden />

        <div className={styles.body}>
          <span className={`badge badge--red ${styles.badge}`}>Novinka 2025</span>

          <h1 className={`display ${styles.title}`}>
            Tvůj rapový{' '}
            <span className={styles.highlight}>vesmír</span>
          </h1>

          <p className={styles.sub}>
            Generuj bio raperů, tutoriály pro beatmakery a<br />
            deep-dive články pomocí AI.{' '}
            <strong>No cap. Pure facts.</strong>
          </p>

          <div className={styles.ctas}>
            <Link href="#articles" className="btn btn--primary">
              <span className={styles.arrow}>↗</span>
              Začít generovat
            </Link>
            <Link href="#articles" className="btn btn--outline">
              Prohlížet články
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
