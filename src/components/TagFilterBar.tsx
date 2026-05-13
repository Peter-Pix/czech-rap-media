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
    <section className="bg-white neo-border neo-shadow p-5 md:p-6 flex flex-col gap-5 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <h2 className="font-heading text-lg uppercase text-slate-900">Tagy ve článcích</h2>
        </div>

        <label className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-4 py-2.5 md:min-w-[280px]">
          <Search size={16} className="text-slate-600 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat tag…"
            className="w-full bg-transparent outline-none font-medium text-sm text-slate-900 placeholder:text-slate-400"
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
              className={`text-xs font-semibold uppercase px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                active 
                  ? "bg-[#ff5a2e] text-white border-[#ff5a2e]" 
                  : "bg-white text-slate-900 border-slate-300 hover:border-[#ff5a2e] hover:text-[#ff5a2e]"
              }`}
              title={`${count} články`}
            >
              #{tag}
              <span className={`text-[10px] font-medium ${active ? "text-white/80" : "text-slate-500"}`}>{count}</span>
            </button>
          );
        })}

        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase px-3 py-2 rounded-lg bg-[#ff5a2e] text-white hover:bg-[#e63d0a] transition-all"
          >
            <X size={14} /> Zrušit tagy
          </button>
        )}
      </div>

      {!visibleTags.length && (
        <p className="font-heading text-sm uppercase text-slate-500">Žádný tag neodpovídá hledání.</p>
      )}

      {!query.trim() && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start flex items-center gap-1 font-heading text-xs uppercase text-[#ff5a2e] hover:text-[#e63d0a] transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Ukázat míň" : `Ukázat dalších ${hiddenCount}`}
        </button>
      )}
    </section>
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
