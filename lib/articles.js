import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const articlesDir = path.join(process.cwd(), 'content', 'articles')

export function getAllArticles() {
  if (!fs.existsSync(articlesDir)) return []
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
  return files
    .map(filename => {
      const filePath = path.join(articlesDir, filename)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)
      return {
        ...data,
        slug: data.slug || filename.replace(/\.(mdx|md)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
      }
    })
    .filter(a => a.published !== false)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getArticleBySlug(slug) {
  if (!fs.existsSync(articlesDir)) return null
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
  for (const filename of files) {
    const filePath = path.join(articlesDir, filename)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const articleSlug = data.slug || filename.replace(/\.(mdx|md)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
    if (articleSlug === slug) {
      return { ...data, slug: articleSlug, content }
    }
  }
  return null
}

export function getAllSlugs() {
  return getAllArticles().map(a => ({ params: { slug: a.slug } }))
}

export function getCategoryLabel(article) {
  if (article.category) {
    const map = {
      zpravy: 'ZPRÁVY',
      recenze: 'RECENZE',
      rozhovory: 'ROZHOVORY',
      analyzy: 'ANALÝZY',
      opinion: 'OPINION',
    }
    return map[article.category] || article.category.toUpperCase()
  }
  const tags = article.tags || []
  if (tags.some(t => ['rapper', 'raper', 'rapeři', 'biografie'].includes(t.toLowerCase()))) return 'RAPEŘI'
  if (tags.some(t => ['beat', 'beatmaking', 'produkce'].includes(t.toLowerCase()))) return 'BEATY'
  return 'ČLÁNKY'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
