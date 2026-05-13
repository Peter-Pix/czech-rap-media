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
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 bg-card border border-border rounded px-2.5 py-1.5">
        <Search size={12} className="text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat tag…"
          className="w-full bg-transparent outline-none font-medium text-[10px] sm:text-xs text-ink placeholder:text-muted-soft"
        />
      </label>

      <div className="flex flex-wrap gap-1">
        {visibleTags.map(({ tag, count }) => {
          const active = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`text-[9px] sm:text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 ${
                active 
                  ? "bg-accent text-paper border-accent" 
                  : "bg-card text-muted border-border hover:border-accent hover:text-accent"
              }`}
              title={`${count} články`}
            >
              #{tag}
              <span className={`text-[8px] ${active ? "text-paper/70" : "text-muted-soft"}`}>{count}</span>
            </button>
          );
        })}

        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-accent text-paper transition-all"
          >
            <X size={10} /> Reset
          </button>
        )}
      </div>

      {!visibleTags.length && (
        <p className="text-[10px] text-muted">Žádný tag neodpovídá.</p>
      )}

      {!query.trim() && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-accent hover:text-accent-hover transition-colors"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? "Méně" : `+${hiddenCount} dalších`}
        </button>
      )}
    </div>
  );
}
