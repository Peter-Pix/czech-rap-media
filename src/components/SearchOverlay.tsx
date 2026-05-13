import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock } from "lucide-react";
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-3 sm:px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-white neo-border neo-shadow rounded-lg sm:rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-[#e5e5e5]">
          <Search size={18} className="text-[#ff5a2e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledej články, rapeře, tagy…"
            className="flex-1 bg-transparent font-medium text-sm sm:text-base outline-none text-slate-900 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="divide-y divide-[#e5e5e5] max-h-[55vh] sm:max-h-[60vh] overflow-y-auto">
            {results.map((r) => (
              <li key={r.slug}>
                <button
                  onClick={() => handleSelect(r.slug)}
                  className="w-full text-left px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded uppercase ${CATEGORY_COLORS[r.category] || "bg-slate-200 text-slate-900"}`}>
                      {r.category}
                    </span>
                    {r.readingTime > 0 && (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-slate-500">
                        <Clock size={10} /> {r.readingTime} min
                      </span>
                    )}
                  </div>
                  <p className="font-heading text-sm sm:text-base uppercase leading-tight text-slate-900 group-hover:text-[#ff5a2e]">{r.title}</p>
                  {r.tags.length > 0 && (
                    <div className="flex gap-1.5 sm:gap-2 mt-2 flex-wrap">
                      {r.tags.slice(0, 3).map((t) => (
                        <span key={t} className="flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-slate-500">
                          #{t}
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
          <div className="px-3 sm:px-5 py-6 sm:py-8 text-center font-heading text-sm sm:text-lg uppercase text-slate-500">
            Nic nenalezeno
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-xs sm:text-sm text-slate-400 uppercase">
            ESC pro zavření
          </div>
        )}
      </div>
    </div>
  );
}
