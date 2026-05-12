#!/usr/bin/env node
// scripts/generate-indexes.js
// Pure ESM, no ts-node needed. Runs on Node 18+ with "type":"module"

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const ARTISTS_DIR = path.join(ROOT, "content", "artists");
const GENERATED_DIR = path.join(ROOT, "public", "generated");

// ── Helpers ───────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    if (rest.startsWith("[")) {
      try {
        fm[key] = JSON.parse(rest.replace(/'/g, '"'));
      } catch {
        fm[key] = rest
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    } else if (rest === "true") {
      fm[key] = true;
    } else if (rest === "false") {
      fm[key] = false;
    } else if (
      (rest.startsWith('"') && rest.endsWith('"')) ||
      (rest.startsWith("'") && rest.endsWith("'"))
    ) {
      fm[key] = rest.slice(1, -1);
    } else {
      fm[key] = rest;
    }
  }
  return { fm, body: match[2] };
}

function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Pick first non-empty value from a list of field names */
function pick(fm, ...keys) {
  for (const k of keys) {
    if (fm[k] !== undefined && fm[k] !== "") return fm[k];
  }
  return undefined;
}

/** Skip drafts — handles both boolean `published` and string `status` */
function isPublished(fm) {
  if (fm.published === false) return false;
  const status = (fm.status || "").toLowerCase();
  if (status && status !== "publikováno" && status !== "published") return false;
  return true;
}

function inferCategory(fm, tags) {
  if (fm.category) return fm.category;
  const t = tags.map((x) => x.toLowerCase()).join(" ");
  if (t.includes("bio") || t.includes("raper") || t.includes("rapper")) return "Rapeři";
  if (
    t.includes("návod") ||
    t.includes("studio") ||
    t.includes("beat") ||
    t.includes("mix") ||
    t.includes("produkce") ||
    t.includes("freestyle") ||
    t.includes("battle") ||
    t.includes("flow")
  )
    return "Návody";
  return "Články";
}

function readingTime(body) {
  return Math.ceil(body.trim().split(/\s+/).length / 200);
}

/** Recursively collect all .mdx files under a directory */
function collectMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...collectMdx(full));
    } else if (e.isFile() && e.name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

// ── Load articles ─────────────────────────────────────────

function loadArticles() {
  const files = collectMdx(ARTICLES_DIR);
  const articles = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { fm, body } = parseFrontmatter(raw);

    if (!isPublished(fm)) continue;

    const slug =
      pick(fm, "slug") ||
      path.basename(filePath).replace(/\.mdx$/, "");

    const tags = ensureArray(pick(fm, "tags"));

    articles.push({
      slug,
      title: pick(fm, "title") || slug,
      // Support both "date" (legacy) and "publish_date" (MDX.TOOL export)
      date: pick(fm, "date", "publish_date") || "",
      excerpt: pick(fm, "excerpt") || "",
      // Support both "coverImage" (legacy) and "cover_image" (MDX.TOOL export)
      coverImage: pick(fm, "coverImage", "cover_image") || "",
      featured: fm.featured === true,
      tags,
      artists: ensureArray(pick(fm, "artists")),
      albums: ensureArray(pick(fm, "albums")),
      producers: ensureArray(pick(fm, "producers")),
      genre: pick(fm, "genre") || "",
      mood: ensureArray(pick(fm, "mood")),
      city: pick(fm, "city") || "",
      era: pick(fm, "era") || "",
      related: ensureArray(pick(fm, "related")),
      author: pick(fm, "author") || "Rap Reportér",
      category: inferCategory(fm, tags),
      published: true,
      readingTime: readingTime(body),
    });
  }

  console.log(`  └─ scanned ${files.length} file(s), loaded ${articles.length} published`);
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ── Load artists ──────────────────────────────────────────

function loadArtists() {
  if (!fs.existsSync(ARTISTS_DIR)) return [];
  const files = fs.readdirSync(ARTISTS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(ARTISTS_DIR, f), "utf-8"))
  );
}

// ── Relations ─────────────────────────────────────────────

function generateRelations(articles) {
  const relations = {};
  for (const article of articles) {
    const scores = {};
    for (const other of articles) {
      if (other.slug === article.slug) continue;
      let score = 0;
      score += article.artists.filter((a) => other.artists.includes(a)).length * 5;
      score += article.tags.filter((t) => other.tags.includes(t)).length * 3;
      if (article.genre && article.genre === other.genre) score += 2;
      score += article.producers.filter((p) => other.producers.includes(p)).length * 2;
      score += article.mood.filter((m) => other.mood.includes(m)).length;
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

// ── Tag map ───────────────────────────────────────────────

function generateTagMap(articles) {
  const tagMap = {};
  for (const article of articles) {
    for (const tag of article.tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(article.slug);
    }
  }
  return tagMap;
}

// ── Artist map ────────────────────────────────────────────

function generateArtistMap(articles, artists) {
  const artistMap = {};
  for (const artist of artists) {
    const mentionedIn = articles
      .filter((a) =>
        a.artists.map((x) => x.toLowerCase()).includes(artist.name.toLowerCase())
      )
      .map((a) => a.slug);
    artistMap[artist.slug] = { ...artist, articles: mentionedIn };
  }
  return artistMap;
}

// ── Search index ──────────────────────────────────────────

function generateSearchIndex(articles) {
  return articles.map(
    ({ slug, title, excerpt, tags, artists, genre, category, date, readingTime }) => ({
      slug,
      title,
      excerpt,
      tags,
      artists,
      genre,
      category,
      date,
      readingTime,
    })
  );
}

// ── Main ──────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(GENERATED_DIR))
    fs.mkdirSync(GENERATED_DIR, { recursive: true });

  console.log("🔍 Scanning articles…");
  const articles = loadArticles();
  const artists = loadArtists();

  console.log(`📄 Articles: ${articles.length}`);
  console.log(`🎤 Artists:  ${artists.length}`);

  fs.writeFileSync(
    path.join(GENERATED_DIR, "search-index.json"),
    JSON.stringify(generateSearchIndex(articles), null, 2)
  );
  fs.writeFileSync(
    path.join(GENERATED_DIR, "relations.json"),
    JSON.stringify(generateRelations(articles), null, 2)
  );
  fs.writeFileSync(
    path.join(GENERATED_DIR, "tag-map.json"),
    JSON.stringify(generateTagMap(articles), null, 2)
  );
  fs.writeFileSync(
    path.join(GENERATED_DIR, "artist-map.json"),
    JSON.stringify(generateArtistMap(articles, artists), null, 2)
  );

  console.log("✅ Generated to public/generated/");
}

main();
