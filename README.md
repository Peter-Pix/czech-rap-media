# Czech Rap Media

Autonomní MDX publishing pipeline napojený na GitHub → Vercel.

## Struktura projektu

```
/content
  /articles
    YYYY-MM-DD-slug.mdx   ← produkční články
/public
  /images                 ← cover images (volitelné)
```

## MDX frontmatter standard

Každý článek musí obsahovat:

```mdx
---
title: "Název článku"
slug: "url-slug-clanku"
excerpt: "Krátký popis pro SEO a náhledy (max 160 znaků)"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
coverImage: "/images/cover.jpg"
author: "Rap Reportér"
published: true
---
```

## Konvence pojmenování souborů

```
YYYY-MM-DD-slug.mdx
```

- datum = datum publikace
- slug = URL-friendly identifikátor (bez diakritiky, pomlčky místo mezer)
- příklad: `2026-05-08-yzomandias-novy-album-recenze.mdx`

## Publikační workflow

1. Generace → validace → deduplikace
2. Commit do větve `content` (nebo `main`)
3. Commit message formát: `feat(content): add rap article - {topic}`
4. Vercel automaticky deployuje při každém push

## MDX kompatibilita (Next.js / Vercel)

- Použij `next-mdx-remote` nebo `@next/mdx` pro parsování
- frontmatter čti přes `gray-matter`
- Doporučená konfigurace v `next.config.js`:

```js
const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ })
module.exports = withMDX({ pageExtensions: ['ts', 'tsx', 'mdx'] })
```

## Kategorie a tagy

Tagy jsou pole stringů. Rozšíření na kategorie:
- přidej pole `category` do frontmatter
- kategorie: `zpravy | recenze | rozhovory | analyzy | opinion`

## SEO

- `excerpt` se mapuje na `meta description`
- `slug` = kanonická URL
- `coverImage` = Open Graph image
- `published: false` = draft (nevychází na webu)

## Pravidla pro obsah

- Pouze česky
- Žádné fake citáty, žádné vymyšlené události
- Žádné interaktivní prvky v MDX
- Maximálně 3 publikace za cyklus, cooldown 30–120 minut
