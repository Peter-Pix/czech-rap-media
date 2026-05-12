import Fuse from "fuse.js";

export interface SearchEntry {
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

let fuse: Fuse<SearchEntry> | null = null;
let cachedIndex: SearchEntry[] | null = null;

export async function getSearchIndex(): Promise<SearchEntry[]> {
  if (cachedIndex) return cachedIndex;
  try {
    const res = await fetch("/generated/search-index.json");
    if (!res.ok) return [];
    cachedIndex = await res.json();
    return cachedIndex!;
  } catch {
    return [];
  }
}

export async function initSearch(): Promise<Fuse<SearchEntry>> {
  if (fuse) return fuse;
  const index = await getSearchIndex();
  fuse = new Fuse(index, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "excerpt", weight: 0.2 },
      { name: "tags", weight: 0.2 },
      { name: "artists", weight: 0.15 },
      { name: "genre", weight: 0.05 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return fuse;
}

export async function search(query: string): Promise<SearchEntry[]> {
  if (!query.trim()) return [];
  const f = await initSearch();
  return f.search(query).map((r) => r.item);
}
