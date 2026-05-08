# 4RAP – Český rapový vesmír

Autonomní MDX publishing pipeline: Base44 → GitHub → Vercel.

## Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 (neo-brutalism design)
- **Content:** MDX articles v `/content/articles/`
- **Deploy:** Vercel (automatický deploy při push na `main`)

## Spuštění lokálně

```bash
npm install
npm run dev
```

## Struktura projektu

```
/src
  App.tsx         ← hlavní komponenta
  main.tsx        ← entry point
  index.css       ← Tailwind + custom styly
/content
  /articles
    YYYY-MM-DD-slug.mdx   ← produkční články
index.html
package.json
vite.config.ts
tsconfig.json
```

## MDX frontmatter standard

```mdx
---
title: "Název článku"
slug: "url-slug-clanku"
excerpt: "Krátký popis pro SEO (max 160 znaků)"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
coverImage: "/images/cover.jpg"
author: "Rap Reportér"
published: true
---
```

## Publikační workflow

1. Generace → validace → deduplikace (Rap Reportér pipeline)
2. Commit: `feat(content): add rap article - {topic}`
3. Push na `main` → Vercel automaticky deployuje

## Vercel deploy

Nastav ve Vercel:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
