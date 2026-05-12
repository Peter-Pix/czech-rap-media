export type TagMap = Record<string, string[]>;
export type ArtistMap = Record<string, ArtistEntry>;

export interface ArtistEntry {
  name: string;
  slug: string;
  bio: string;
  city: string;
  genre: string[];
  tags: string[];
  image: string;
  active: boolean;
  era: string[];
  articles: string[];
}

let cachedTags: TagMap | null = null;
let cachedArtists: ArtistMap | null = null;

export async function getTagMap(): Promise<TagMap> {
  if (cachedTags) return cachedTags;
  try {
    const res = await fetch("/generated/tag-map.json");
    if (!res.ok) return {};
    cachedTags = await res.json();
    return cachedTags!;
  } catch {
    return {};
  }
}

export async function getArtistMap(): Promise<ArtistMap> {
  if (cachedArtists) return cachedArtists;
  try {
    const res = await fetch("/generated/artist-map.json");
    if (!res.ok) return {};
    cachedArtists = await res.json();
    return cachedArtists!;
  } catch {
    return {};
  }
}

export async function getArtist(slug: string): Promise<ArtistEntry | null> {
  const map = await getArtistMap();
  return map[slug] ?? null;
}

export async function getArticlesForTag(tag: string): Promise<string[]> {
  const tagMap = await getTagMap();
  return tagMap[tag] ?? [];
}
