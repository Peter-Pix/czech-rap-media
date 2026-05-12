import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const ARTISTS_DIR = path.join(ROOT, "content", "artists");
const GENERATED_DIR = path.join(ROOT, "generated");

// ── Helpers ──────────────────────────────────────────────

function parseFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm: Record<string, unknown> = {};
  const lines = match[1].split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon === -1) { i++; continue; }
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    // Array values: either inline JSON array or YAML list
    if (rest.startsWith("[")) {
      try {
        fm[key] = JSON.parse(rest.replace(/\'(?=[^,\]\[]*(?:[,\]]|$))/g, "\""));
      } catch {
        fm[key] = rest.slice(1, -1).split(",").map((s) => s.trim().replace(/^["\']|["\']$/g, ""));
      }
      i++; continue;
    }
    // Quoted string
    if ((rest.startsWith('"') && rest.endsWith('"')) || (rest.startsWith("'") && rest.endsWith("\'"))) {
      fm[key] = rest.slice(1, -1);
      i++; continue;
    }
    // Boolean
    if (rest === "true") { fm[key] = true; i++; continue; }
    if (rest === "false") { fm[key] = false; i++; continue; }
    fm[key] = rest;
    i++;
  }
  return { fm, body: match[2] };
}

function ensureArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// ── Load articles ─────────────────────────────────────────

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  featured: boolean;
  tags: string[];
  artists: string[];
  albums: string[];
  producers: string[];
  genre: string;
  mood: string[];
  city: string;
  era: string;
  related: string[];
  author: string;
  category: string;
  published: boolean;
  readingTime: number;
}

function loadArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));
  const articles: ArticleMeta[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf-8");
    const { fm, body } = parseFrontmatter(raw);
    if (fm.published === false) continue;
    const slug = (fm.slug as string) || file.replace(/\.mdx$/, "");
    articles.push({
      slug,
      title: (fm.title as string) || slug,
      date: (fm.date as string) || "",
      excerpt: (fm.excerpt as string) || "",
      coverImage: (fm.coverImage as string) || "",
      featured: fm.featured === true,
      tags: ensureArray(fm.tags),
      artists: ensureArray(fm.artists),
      albums: ensureArray(fm.albums),
      producers: ensureArray(fm.producers),
      genre: (fm.genre as string) || "",
      mood: ensureArray(fm.mood),
      city: (fm.city as string) || "",
      era: (fm.era as string) || "",
      related: ensureArray(fm.related),
      author: (fm.author as string) || "Rap Reportér",
      category: (fm.category as string) || "Články",
      published: true,
      readingTime: readingTime(body),
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ── Load artists ──────────────────────────────────────────

interface ArtistData {
  name: string;
  slug: string;
  bio: string;
  city: string;
  genre: string[];
  tags: string[];
  image: string;
  active: boolean;
  era: string[];
}

function loadArtists(): ArtistData[] {
  if (!fs.existsSync(ARTISTS_DIR)) return [];
  const files = fs.readdirSync(ARTISTS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(ARTISTS_DIR, f), "utf-8")));
}

// ── Generate relations ────────────────────────────────────

function generateRelations(articles: ArticleMeta[]): Record<string, string[]> {
  const relations: Record<string, string[]> = {};
  for (const article of articles) {
    const scores: Record<string, number> = {};
    for (const other of articles) {
      if (other.slug === article.slug) continue;
      let score = 0;
      // shared artists (highest weight)
      const sharedArtists = article.artists.filter((a) => other.artists.includes(a));
      score += sharedArtists.length * 5;
      // shared tags
      const sharedTags = article.tags.filter((t) => other.tags.includes(t));
      score += sharedTags.length * 3;
      // same genre
      if (article.genre && article.genre === other.genre) score += 2;
      // shared producers
      const sharedProducers = article.producers.filter((p) => other.producers.includes(p));
      score += sharedProducers.length * 2;
      // shared mood
      const sharedMood = article.mood.filter((m) => other.mood.includes(m));
      score += sharedMood.length;
      // explicit related
      if (article.related.includes(other.slug)) score += 10;
      if (score > 0) scores[other.slug] = score;
    }
    relations[article.slug] = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug]) => slug);
  }
  return relations;
}

// ── Generate tag map ──────────────────────────────────────

function generateTagMap(articles: ArticleMeta[]): Record<string, string[]> {
  const tagMap: Record<string, string[]> = {};
  for (const article of articles) {
    for (const tag of article.tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(article.slug);
    }
  }
  return tagMap;
}

// ── Generate artist map ───────────────────────────────────

interface ArtistMapEntry extends ArtistData {
  articles: string[];
}

function generateArtistMap(
  articles: ArticleMeta[],
  artists: ArtistData[]
): Record<string, ArtistMapEntry> {
  const artistMap: Record<string, ArtistMapEntry> = {};
  for (const artist of artists) {
    const mentionedIn = articles
      .filter((a) => a.artists.map((x) => x.toLowerCase()).includes(artist.name.toLowerCase()))
      .map((a) => a.slug);
    artistMap[artist.slug] = { ...artist, articles: mentionedIn };
  }
  return artistMap;
}

// ── Search index ──────────────────────────────────────────

interface SearchEntry {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  artists: string[];
  genre: string;
  category: string;
  date: string;
  readingTime: number;
}

function generateSearchIndex(articles: ArticleMeta[]): SearchEntry[] {
  return articles.map(({ slug, title, excerpt, tags, artists, genre, category, date, readingTime }) => ({
    slug, title, excerpt, tags, artists, genre, category, date, readingTime,
  }));
}

// ── Main ──────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const articles = loadArticles();
  const artists = loadArtists();

  console.log(`📄 Found ${articles.length} articles`);
  console.log(`🎤 Found ${artists.length} artists`);

  const searchIndex = generateSearchIndex(articles);
  const relations = generateRelations(articles);
  const tagMap = generateTagMap(articles);
  const artistMap = generateArtistMap(articles, artists);

  fs.writeFileSync(path.join(GENERATED_DIR, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "relations.json"), JSON.stringify(relations, null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "tag-map.json"), JSON.stringify(tagMap, null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "artist-map.json"), JSON.stringify(artistMap, null, 2));

  console.log("✅ Generated: search-index.json, relations.json, tag-map.json, artist-map.json");
}

main();
