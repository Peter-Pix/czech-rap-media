export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  category: string;
  coverImage?: string;
  author: string;
  published: boolean;
  rawContent: string; // MDX body bez frontmatter
}

const mdxFiles = import.meta.glob("/content/articles/*.mdx", {
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
    if (typeof val === "string" && val.startsWith("[")) {
      try { val = JSON.parse(val.replace(/'/g, "\"'\"")); } catch { val = []; }
    }
    if (val === "true") val = true;
    if (val === "false") val = false;
    if (typeof val === "string" && val.startsWith("\"") && val.endsWith("\"")) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body: match[2] };
}

function inferCategory(tags: string[]): string {
  const t = tags.map((x) => x.toLowerCase()).join(" ");
  if (t.includes("bio") || t.includes("raper") || t.includes("rapper")) return "Rapeři";
  if (t.includes("návod") || t.includes("studio") || t.includes("nahrávání") || t.includes("beat") || t.includes("mix")) return "Návody";
  return "Články";
}

export function loadArticles(): Article[] {
  const articles: Article[] = [];
  for (const [filePath, raw] of Object.entries(mdxFiles)) {
    const { fm, body } = parseFrontmatter(raw);
    if (fm.published === false) continue;
    const fileSlug =
      (fm.slug as string) ||
      filePath.split("/").pop()!.replace(/\.mdx$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
    articles.push({
      id: fileSlug,
      slug: fileSlug,
      title: (fm.title as string) || fileSlug,
      excerpt: (fm.excerpt as string) || "",
      date: (fm.date as string) || "",
      tags,
      category: (fm.category as string) || inferCategory(tags),
      coverImage: fm.coverImage as string | undefined,
      author: (fm.author as string) || "Rap Reportér",
      published: true,
      rawContent: body,
    });
  }
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}
