import Link from 'next/link'
import { getCategoryLabel, formatDate } from '../lib/articles'
import styles from './ArticleCard.module.css'

export default function ArticleCard({ article }) {
  const category = getCategoryLabel(article)
  const date = formatDate(article.date)

  return (
    <Link href={`/${article.slug}`} className={styles.card}>
      <div className={styles.meta}>
        <span className="badge">{category}</span>
        {date && <time className={styles.date}>{date}</time>}
      </div>
      <h2 className={`headline ${styles.title}`}>{article.title}</h2>
      {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
    </Link>
  )
}
