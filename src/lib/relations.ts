export type RelationsMap = Record<string, string[]>;

let cached: RelationsMap | null = null;

export async function getRelations(): Promise<RelationsMap> {
  if (cached) return cached;
  try {
    const res = await fetch("/generated/relations.json");
    if (!res.ok) return {};
    cached = await res.json();
    return cached!;
  } catch {
    return {};
  }
}

export async function getRelatedSlugs(slug: string): Promise<string[]> {
  const relations = await getRelations();
  return relations[slug] ?? [];
}
