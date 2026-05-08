import Head from 'next/head'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import ArticleCard from '../components/ArticleCard'
import Footer from '../components/Footer'
import { getAllArticles, getCategoryLabel } from '../lib/articles'
import styles from './index.module.css'

const CAT_MAP = {
  raperi: 'RAPEŘI',
  clanky: 'ČLÁNKY',
  beaty: 'BEATY',
}

const FILTER_TABS = [
  { key: '', label: 'Vše' },
  { key: 'raperi', label: 'Rapeři' },
  { key: 'clanky', label: 'Články' },
  { key: 'beaty', label: 'Beaty' },
]

export default function Home({ articles }) {
  const router = useRouter()
  const activeCat = router.query.cat || ''

  const filtered = activeCat
    ? articles.filter(a => getCategoryLabel(a) === CAT_MAP[activeCat])
    : articles

  function setFilter(key) {
    router.push(key ? `/?cat=${key}` : '/', undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>Czech Rap Media — Tvůj rapový vesmír</title>
        <meta name="description" content="Generuj bio raperů, tutoriály pro beatmakery a deep-dive články. AI-powered česky." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Nav />

      <main>
        <Hero />

        <section id="articles" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={`display ${styles.sectionTitle}`}>Články</h2>

            <div className={styles.tabs}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`${styles.tab} ${activeCat === tab.key ? styles.tabActive : ''}`}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>Žádné články v této kategorii.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}

export async function getStaticProps() {
  const articles = getAllArticles()
  return {
    props: { articles }
  }
}
