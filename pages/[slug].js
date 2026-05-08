import Head from 'next/head'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { getAllSlugs, getArticleBySlug, getCategoryLabel, formatDate } from '../lib/articles'
import styles from './[slug].module.css'

export default function ArticlePage({ article, mdxSource }) {
  const category = getCategoryLabel(article)
  const date = formatDate(article.date)

  return (
    <>
      <Head>
        <title>{article.title} — Czech Rap Media</title>
        <meta name="description" content={article.excerpt || ''} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || ''} />
        {article.coverImage && <meta property="og:image" content={article.coverImage} />}
      </Head>

      <Nav />

      <main className={styles.main}>
        <div className={styles.container}>

          {/* back */}
          <Link href="/" className={styles.back}>
            ← Zpět na seznam
          </Link>

          {/* header card */}
          <header className={styles.header}>
            <div className={styles.headerMeta}>
              <span className="badge">{category}</span>
              {date && <time className={styles.date}>{date}</time>}
              {article.author && <span className={styles.author}>· {article.author}</span>}
            </div>
            <h1 className={`display ${styles.title}`}>{article.title}</h1>
            {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
            {article.tags?.length > 0 && (
              <div className={styles.tags}>
                {article.tags.map(tag => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            )}
          </header>

          {/* article body */}
          <article className={styles.body}>
            {mdxSource ? (
              <MDXRemote {...mdxSource} />
            ) : (
              <p className={styles.noContent}>Obsah článku není k dispozici.</p>
            )}
          </article>

        </div>
      </main>

      <Footer />
    </>
  )
}

export async function getStaticPaths() {
  const paths = getAllSlugs()
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const article = getArticleBySlug(params.slug)
  if (!article) return { notFound: true }

  let mdxSource = null
  if (article.content) {
    mdxSource = await serialize(article.content)
  }

  const { content, ...articleMeta } = article
  return {
    props: { article: articleMeta, mdxSource }
  }
}
