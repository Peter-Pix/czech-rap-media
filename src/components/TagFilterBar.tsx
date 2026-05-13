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
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-3 py-2">
        <Search size={14} className="text-slate-500 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat tag…"
          className="w-full bg-transparent outline-none font-medium text-xs text-slate-900 placeholder:text-slate-400"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map(({ tag, count }) => {
          const active = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`text-[10px] sm:text-xs font-medium uppercase px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                active 
                  ? "bg-[#ff5a2e] text-white border-[#ff5a2e]" 
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#ff5a2e] hover:text-[#ff5a2e]"
              }`}
              title={`${count} články`}
            >
              #{tag}
              <span className={`text-[9px] ${active ? "text-white/70" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}

        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-medium uppercase px-2 py-1 rounded bg-[#ff5a2e] text-white transition-all"
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {!visibleTags.length && (
        <p className="text-xs text-slate-500">Žádný tag neodpovídá.</p>
      )}

      {!query.trim() && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[#ff5a2e] hover:text-[#e63d0a] transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Méně" : `+${hiddenCount} dalších`}
        </button>
      )}
    </div>
  );
}
