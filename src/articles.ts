export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  artists: string[];
  albums: string[];
  producers: string[];
  genre: string;
  mood: string[];
  city: string;
  era: string;
  related: string[];
  category: string;
  coverImage?: string;
  featured: boolean;
  author: string;
  published: boolean;
  readingTime: number;
  rawContent: string;
}

const mdxFiles = import.meta.glob("/content/articles/**/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val: unknown = line.slice(colon + 1).trim();
    // JSON array
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const cleaned = (val as string).replace(/\'(?=[^,\]]*(?:[,\]]|$))/g, "\"");
        val = JSON.parse(cleaned);
      } catch {
        val = (val as string).slice(1, -1).split(",").map((s) => s.trim().replace(/^["\']|["\']$/g, "")).filter(Boolean);
      }
    } else if (val === "true") {
      val = true;
    } else if (val === "false") {
      val = false;
    } else if (typeof val === "string" && val.startsWith("\"") && val.endsWith("\"")) {
      val = (val as string).slice(1, -1);
    } else if (typeof val === "string" && val.startsWith("'") && val.endsWith("'")) {
      val = (val as string).slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body: match[2] };
}

function ensureArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function inferCategory(tags: string[]): string {
  const t = tags.map((x) => x.toLowerCase()).join(" ");
  if (t.includes("bio") || t.includes("raper") || t.includes("rapper")) return "Rapeři";
  if (t.includes("návod") || t.includes("studio") || t.includes("nahrávání") || t.includes("beat") || t.includes("mix")) return "Návody";
  return "Články";
}

function estimateReadingTime(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

export function loadArticles(): Article[] {
  const articles: Article[] = [];
  for (const [filePath, raw] of Object.entries(mdxFiles)) {
    const { fm, body } = parseFrontmatter(raw);
    if (fm.published === false) continue;
    const fileSlug =
      (fm.slug as string) ||
      filePath.split("/").pop()!.replace(/\.mdx$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const tags = ensureArray(fm.tags);
    articles.push({
      id: fileSlug,
      slug: fileSlug,
      title: (fm.title as string) || fileSlug,
      excerpt: (fm.excerpt as string) || "",
      date: (fm.date as string) || "",
      tags,
      artists: ensureArray(fm.artists),
      albums: ensureArray(fm.albums),
      producers: ensureArray(fm.producers),
      genre: (fm.genre as string) || "",
      mood: ensureArray(fm.mood),
      city: (fm.city as string) || "",
      era: (fm.era as string) || "",
      related: ensureArray(fm.related),
      category: (fm.category as string) || inferCategory(tags),
      coverImage: fm.coverImage as string | undefined,
      featured: fm.featured === true,
      author: (fm.author as string) || "Rap Reportér",
      published: true,
      readingTime: estimateReadingTime(body),
      rawContent: body,
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}
