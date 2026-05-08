import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styles from './Nav.module.css'

const LINKS = [
  { href: '/?cat=raperi', label: 'Rapeři' },
  { href: '/?cat=clanky', label: 'Články' },
  { href: '/?cat=beaty', label: 'Beaty' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMain}>Czech</span>
          <span className={styles.logoAccent}>Rap</span>
          <span className={styles.logoMain}>Media</span>
        </Link>

        <ul className={`${styles.links} ${open ? styles.linksOpen : ''}`}>
          {LINKS.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={styles.link} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className={styles.burger}
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <span className={open ? styles.burgerLineOpen : styles.burgerLine} />
          <span className={open ? styles.burgerLineOpenMid : styles.burgerLine} />
          <span className={open ? styles.burgerLineOpen : styles.burgerLine} />
        </button>
      </div>
    </nav>
  )
}
