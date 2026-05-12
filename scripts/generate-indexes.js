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
        fm[key] = rest.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      }
    } else if (rest === "true") {
      fm[key] = true;
    } else if (rest === "false") {
      fm[key] = false;
    } else if ((rest.startsWith('"') && rest.endsWith('"')) || (rest.startsWith("'") && rest.endsWith("'"))) {
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
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function readingTime(body) {
  return Math.ceil(body.trim().split(/\s+/).length / 200);
}

// ── Load articles ─────────────────────────────────────────

function loadArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".mdx"));
  const articles = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf-8");
    const { fm, body } = parseFrontmatter(raw);
    if (fm.published === false) continue;
    const slug = fm.slug || file.replace(/\.mdx$/, "");
    articles.push({
      slug,
      title: fm.title || slug,
      date: fm.date || "",
      excerpt: fm.excerpt || "",
      coverImage: fm.coverImage || "",
      featured: fm.featured === true,
      tags: ensureArray(fm.tags),
      artists: ensureArray(fm.artists),
      albums: ensureArray(fm.albums),
      producers: ensureArray(fm.producers),
      genre: fm.genre || "",
      mood: ensureArray(fm.mood),
      city: fm.city || "",
      era: fm.era || "",
      related: ensureArray(fm.related),
      author: fm.author || "Rap Reportér",
      category: fm.category || "Články",
      published: true,
      readingTime: readingTime(body),
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ── Load artists ──────────────────────────────────────────

function loadArtists() {
  if (!fs.existsSync(ARTISTS_DIR)) return [];
  const files = fs.readdirSync(ARTISTS_DIR).filter(f => f.endsWith(".json"));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(ARTISTS_DIR, f), "utf-8")));
}

// ── Relations ─────────────────────────────────────────────

function generateRelations(articles) {
  const relations = {};
  for (const article of articles) {
    const scores = {};
    for (const other of articles) {
      if (other.slug === article.slug) continue;
      let score = 0;
      score += article.artists.filter(a => other.artists.includes(a)).length * 5;
      score += article.tags.filter(t => other.tags.includes(t)).length * 3;
      if (article.genre && article.genre === other.genre) score += 2;
      score += article.producers.filter(p => other.producers.includes(p)).length * 2;
      score += article.mood.filter(m => other.mood.includes(m)).length;
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
      .filter(a => a.artists.map(x => x.toLowerCase()).includes(artist.name.toLowerCase()))
      .map(a => a.slug);
    artistMap[artist.slug] = { ...artist, articles: mentionedIn };
  }
  return artistMap;
}

// ── Search index ──────────────────────────────────────────

function generateSearchIndex(articles) {
  return articles.map(({ slug, title, excerpt, tags, artists, genre, category, date, readingTime }) => ({
    slug, title, excerpt, tags, artists, genre, category, date, readingTime,
  }));
}

// ── Main ──────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const articles = loadArticles();
  const artists = loadArtists();

  console.log(`📄 Articles: ${articles.length}`);
  console.log(`🎤 Artists: ${artists.length}`);

  fs.writeFileSync(path.join(GENERATED_DIR, "search-index.json"), JSON.stringify(generateSearchIndex(articles), null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "relations.json"), JSON.stringify(generateRelations(articles), null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "tag-map.json"), JSON.stringify(generateTagMap(articles), null, 2));
  fs.writeFileSync(path.join(GENERATED_DIR, "artist-map.json"), JSON.stringify(generateArtistMap(articles, artists), null, 2));

  console.log("✅ Generated to public/generated/");
}

main();
