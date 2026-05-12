import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, Hash } from "lucide-react";
import { search, type SearchEntry } from "../lib/search";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Rapeři": "bg-[#FF4A4A] text-white",
  "Návody": "bg-[#39FF14] text-black",
  "Články": "bg-[#00BFFF] text-black",
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-[#FFDE00] neo-border neo-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b-4 border-black">
          <Search size={22} className="text-black shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledej články, rapeře, tagy…"
            className="flex-1 bg-transparent font-heading text-lg uppercase outline-none placeholder:text-black/40"
          />
          <button onClick={onClose} className="shrink-0 hover:opacity-70">
            <X size={22} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="divide-y-4 divide-black max-h-[60vh] overflow-y-auto">
            {results.map((r) => (
              <li key={r.slug}>
                <button
                  onClick={() => handleSelect(r.slug)}
                  className="w-full text-left px-5 py-4 hover:bg-black hover:text-[#FFDE00] transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 neo-border uppercase ${CATEGORY_COLORS[r.category] || "bg-gray-200 text-black"} group-hover:border-[#FFDE00]`}>
                      {r.category}
                    </span>
                    {r.readingTime > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-black/50 group-hover:text-[#FFDE00]/70">
                        <Clock size={12} /> {r.readingTime} min
                      </span>
                    )}
                  </div>
                  <p className="font-heading text-base uppercase leading-tight">{r.title}</p>
                  {r.tags.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {r.tags.slice(0, 4).map((t) => (
                        <span key={t} className="flex items-center gap-0.5 text-xs font-bold text-black/60 group-hover:text-[#FFDE00]/60">
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
          <div className="px-5 py-8 text-center font-heading text-lg uppercase text-black/50">
            Nic nenalezeno pro „{query}"
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="px-5 py-4 font-bold text-sm text-black/50 uppercase tracking-wider">
            Začni psát — ESC pro zavření
          </div>
        )}
      </div>
    </div>
  );
}
