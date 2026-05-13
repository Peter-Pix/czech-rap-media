import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, Hash } from "lucide-react";
import { search, type SearchEntry } from "../lib/search";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Rapeři": "bg-[#ff5a2e] text-white",
  "Návody": "bg-[#4a90e2] text-white",
  "Články": "bg-[#7c3aed] text-white",
};

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await search(query);
      setResults(res.slice(0, 8));
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSelect = (slug: string) => {
    navigate(`/article/${slug}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-white neo-border neo-shadow rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e5e5]">
          <Search size={20} className="text-[#ff5a2e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledej články, rapeře, tagy…"
            className="flex-1 bg-transparent font-medium text-base outline-none text-slate-900 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="divide-y divide-[#e5e5e5] max-h-[60vh] overflow-y-auto">
            {results.map((r) => (
              <li key={r.slug}>
                <button
                  onClick={() => handleSelect(r.slug)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase ${CATEGORY_COLORS[r.category] || "bg-slate-200 text-slate-900"}`}>
                      {r.category}
                    </span>
                    {r.readingTime > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-slate-700">
                        <Clock size={12} /> {r.readingTime} min
                      </span>
                    )}
                  </div>
                  <p className="font-heading text-base uppercase leading-tight text-slate-900 group-hover:text-[#ff5a2e]">{r.title}</p>
                  {r.tags.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.tags.slice(0, 4).map((t) => (
                        <span key={t} className="flex items-center gap-1 text-xs font-medium text-slate-600 group-hover:text-slate-800">
                          <Hash size={10} />#{t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="px-5 py-8 text-center font-heading text-lg uppercase text-slate-500">
            Nic nenalezeno pro „{query}"
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="px-5 py-4 font-medium text-sm text-slate-500 uppercase tracking-wider">
            Začni psát — ESC pro zavření
          </div>
        )}
      </div>
    </div>
  );
}
