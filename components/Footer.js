import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.logo}>
          Czech <strong>Rap</strong> Media
        </span>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Czech Rap Media · AI-generovaný obsah · Pouze česky
        </p>
      </div>
    </footer>
  )
}
