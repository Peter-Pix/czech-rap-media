# 4RAP – Český rapový vesmír

Autonomní MDX publishing pipeline: Base44 → GitHub → Vercel.

## Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 (neo-brutalism design)
- **Content:** MDX articles v `/content/articles/`
- **Search:** Fuse.js (client-side, no backend needed)
- **Deploy:** Vercel (automatický deploy při push na `main`)

## Spuštění lokálně

```bash
npm install
npm run generate   # generuje /generated/*.json indexy
npm run dev
```

## Generování indexů (build-time)

```bash
npm run generate
```

Výstup:
- `/generated/search-index.json` — pro Fuse.js search
- `/generated/artist-map.json` — pro artist pages
- `/generated/tag-map.json` — pro tag pages
- `/generated/relations.json` — pro related articles

## Struktura projektu

```
/content
  /articles/         ← MDX články
  /artists/          ← JSON profily raperů
/generated/          ← auto-generované indexy (prebuild)
/scripts/
  generate-indexes.ts ← hlavní generátor
/src
  App.tsx            ← routing + homepage
  ArticlePage.tsx    ← article detail
  articles.ts        ← MDX loader
  /components/
    SearchOverlay.tsx    ← CMD+K search
    RelatedArticles.tsx  ← related content
    ReadingProgress.tsx  ← scroll progress bar
  /lib/
    search.ts         ← Fuse.js wrapper
    relations.ts      ← relations loader
    metadata.ts       ← artist/tag map loaders
    readingTime.ts    ← reading time util
```

## MDX frontmatter standard

```yaml
---
title: "Název článku"
slug: "url-slug-clanku"
date: "YYYY-MM-DD"
excerpt: "Krátký popis (max 160 znaků)"
coverImage: "/images/cover.jpg"
featured: false

tags: ["tag1", "tag2"]
artists: ["Yzomandias", "Nik Tendo"]
albums: []
producers: []
genre: "czech-rap"
mood: ["analytický"]
city: "Praha"
era: "2020s"

related: ["other-slug"]
author: "Rap Reportér"
category: "Články"
published: true
---
```

## Routy

- `/` — homepage (Latest + Editorial Picks + tag/category filters)
- `/article/:slug` — article detail (reading progress + related articles)
- `/tag/:tag` — všechny články s daným tagem
- `/artist/:slug` — profil rapera + jeho články

## Features

- ⌘K / Ctrl+K — live search (Fuse.js, client-side)
- Clickable tags → tag pages
- Clickable artists → artist pages
- Related articles (metadata similarity scoring)
- Reading progress bar
- Reading time estimate

## Vercel deploy

Nastav ve Vercel:
- **Framework Preset:** Vite
- **Build Command:** `npm run build` (prebuild script generuje indexy)
- **Output Directory:** `dist`
