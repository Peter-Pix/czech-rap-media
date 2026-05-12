import { useMemo, useState } from "react";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Article } from "../articles";

interface TagFilterBarProps {
  articles: Article[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  initialLimit?: number;
}

interface TagStat {
  tag: string;
  count: number;
}

export default function TagFilterBar({
  articles,
  activeTags,
  onToggleTag,
  onClearTags,
  initialLimit = 8,
}: TagFilterBarProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const tags = useMemo<TagStat[]>(() => {
    const counts = new Map<string, number>();

    for (const article of articles) {
      const uniqueArticleTags = new Set(article.tags.filter(Boolean));
      for (const tag of uniqueArticleTags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "cs"));
  }, [articles]);

  const filteredTags = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter(({ tag }) => tag.toLowerCase().includes(normalized));
  }, [tags, query]);

  const visibleTags = expanded || query.trim()
    ? filteredTags
    : filteredTags.slice(0, initialLimit);

  if (!tags.length) return null;

  const hiddenCount = Math.max(0, filteredTags.length - initialLimit);

  return (
    <section className="bg-white neo-border neo-shadow p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <h2 className="font-heading text-lg uppercase">Tagy ve článcích</h2>
        </div>

        <label className="flex items-center gap-2 bg-[#FFDE00] neo-border px-3 py-2 md:min-w-[260px]">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat tag…"
            className="w-full bg-transparent outline-none font-bold text-sm placeholder:text-black/40"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map(({ tag, count }) => {
          const active = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`text-xs font-bold uppercase px-3 py-1 neo-border transition-colors flex items-center gap-1
                ${active ? "bg-black text-[#FFD800]" : "bg-[#FFD800] text-black hover:bg-black hover:text-[#FFD800]"}`}
              title={`${count} článků`}
            >
              #{tag}
              <span className={`text-[10px] px-1 ${active ? "text-[#FFD800]/70" : "text-black/40"}`}>{count}</span>
            </button>
          );
        })}

        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="flex items-center gap-1 text-xs font-bold uppercase px-3 py-1 neo-border bg-[#FF4A4A] text-white"
          >
            <X size={12} /> Zrušit tagy
          </button>
        )}
      </div>

      {!visibleTags.length && (
        <p className="font-heading text-sm uppercase text-black/40">Žádný tag neodpovídá hledání.</p>
      )}

      {!query.trim() && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start flex items-center gap-1 font-heading text-xs uppercase underline decoration-4 decoration-black underline-offset-4 hover:opacity-70"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Ukázat míň" : `Ukázat dalších ${hiddenCount}`}
        </button>
      )}
    </section>
  );
}
