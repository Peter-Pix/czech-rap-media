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

// Glob covers flat layout AND any subfolders (Rapeři/, Návody/, Články/)
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
    // JSON / YAML array  e.g.  ["a","b"]  or  [a, b]
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const cleaned = (val as string).replace(/'/g, '"');
        val = JSON.parse(cleaned);
      } catch {
        val = (val as string)
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    } else if (val === "true") {
      val = true;
    } else if (val === "false") {
      val = false;
    } else if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
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

function inferCategory(fm: Record<string, unknown>, tags: string[]): string {
  // 1. Explicit category field wins
  if (fm.category) return fm.category as string;
  // 2. Infer from tags
  const t = tags.map((x) => x.toLowerCase()).join(" ");
  if (t.includes("bio") || t.includes("raper") || t.includes("rapper")) return "Rapeři";
  if (
    t.includes("návod") ||
    t.includes("studio") ||
    t.includes("nahrávání") ||
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

function estimateReadingTime(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

/** Resolve a field that may appear under multiple key names */
function pick(fm: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (fm[k] !== undefined && fm[k] !== "") return fm[k];
  }
  return undefined;
}

/** Skip articles whose status is explicitly draft/koncept */
function isPublished(fm: Record<string, unknown>): boolean {
  // explicit boolean flag
  if (fm.published === false) return false;
  // MDX.TOOL status field
  const status = (fm.status as string | undefined)?.toLowerCase();
  if (status && status !== "publikováno" && status !== "published") return false;
  return true;
}

export function loadArticles(): Article[] {
  const articles: Article[] = [];
  for (const [filePath, raw] of Object.entries(mdxFiles)) {
    const { fm, body } = parseFrontmatter(raw);

    if (!isPublished(fm)) continue;

    const fileSlug =
      (pick(fm, "slug") as string) ||
      filePath.split("/").pop()!.replace(/\.mdx$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");

    const tags = ensureArray(pick(fm, "tags"));

    articles.push({
      id: fileSlug,
      slug: fileSlug,
      title: (pick(fm, "title") as string) || fileSlug,
      excerpt: (pick(fm, "excerpt") as string) || "",
      // Support both "date" (legacy) and "publish_date" (MDX.TOOL export)
      date: (pick(fm, "date", "publish_date") as string) || "",
      tags,
      artists: ensureArray(pick(fm, "artists")),
      albums: ensureArray(pick(fm, "albums")),
      producers: ensureArray(pick(fm, "producers")),
      genre: (pick(fm, "genre") as string) || "",
      mood: ensureArray(pick(fm, "mood")),
      city: (pick(fm, "city") as string) || "",
      era: (pick(fm, "era") as string) || "",
      related: ensureArray(pick(fm, "related")),
      category: inferCategory(fm, tags),
      // Support both "coverImage" (legacy) and "cover_image" (MDX.TOOL export)
      coverImage: (pick(fm, "coverImage", "cover_image") as string) || undefined,
      featured: fm.featured === true,
      author: (pick(fm, "author") as string) || "Rap Reportér",
      published: true,
      readingTime: estimateReadingTime(body),
      rawContent: body,
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}
