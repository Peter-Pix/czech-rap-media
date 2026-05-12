import { useState, useMemo, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Hash, Search, X } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ArticlePage from "./ArticlePage";
import SearchOverlay from "./components/SearchOverlay";
import SEO from "./components/SEO";

// ── Types ─────────────────────────────────────────────────

type Category = "Vše" | "Rapeři" | "Návody" | "Články";
const CATEGORIES: Category[] = ["Vše", "Rapeři", "Návody", "Články"];

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

// ── Small components ──────────────────────────────────────

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-block px-3 py-1 text-sm font-bold tracking-wider uppercase neo-border ${className}`}>
    {children}
  </span>
);

const FilterButton = ({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`neo-button px-5 py-2.5 font-heading text-base uppercase flex items-center gap-2
      ${isActive ? "bg-black text-white translate-x-[2px] translate-y-[2px] !shadow-none" : "bg-white text-black"}`}
  >
    {children}
  </button>
);

const ArticleCard = ({ article, onTagClick }: { article: Article; onTagClick?: (tag: string) => void }) => {
  const navigate = useNavigate();
  const colorClass = CATEGORY_COLORS[article.category] || "bg-gray-200 text-black";
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
    : "";
  return (
    <article
      onClick={() => navigate(`/article/${article.slug}`)}
      className="bg-white neo-border neo-shadow p-6 lg:p-8 flex flex-col gap-4 cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-100"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <Badge className={colorClass}>{article.category}</Badge>
        <span className="font-bold text-gray-500 text-sm">{formattedDate}</span>
        {article.readingTime > 0 && (
          <span className="font-bold text-gray-400 text-sm">{article.readingTime} min čtení</span>
        )}
        {article.featured && (
          <span className="font-bold text-xs px-2 py-0.5 bg-[#FFD800] neo-border uppercase">⭐ Featured</span>
        )}
      </div>
      <h2 className="font-heading text-2xl lg:text-3xl tracking-wide uppercase leading-tight">
        {article.title}
      </h2>
      <p className="font-sans font-medium text-lg text-gray-700 leading-[1.9]">
        {article.excerpt}
      </p>
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {article.tags.slice(0, 5).map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick ? onTagClick(tag) : navigate(`/tag/${encodeURIComponent(tag)}`)}
              className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border hover:bg-black hover:text-[#FFD800] transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};

// ── Tag Page ──────────────────────────────────────────────

function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);
  const filtered = useMemo(
    () => articles.filter((a) => a.tags.includes(tag || "")),
    [articles, tag]
  );

  return (
    <div className="min-h-screen font-sans">
      <SEO
        title={`#${tag}`}
        description={`${filtered.length} články se štítkem ${tag}`}
        url={`/tag/${tag}`}
      />
      <Header onSearch={() => {}} />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/")} className="neo-button bg-white text-black px-4 py-2 font-heading text-sm uppercase">← Zpět</button>
          <h1 className="font-heading text-3xl uppercase">#{tag}</h1>
          <span className="font-bold text-gray-500">{filtered.length} článků</span>
        </div>
        {filtered.length === 0 ? (
          <p className="font-heading text-xl uppercase text-black/50">Žádné články s tímto tagem.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((a) => <ArticleCard key={a.slug} article={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Artist Page ───────────────────────────────────────────

function ArtistPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);

  const [artistData, setArtistData] = useState<{
    name: string; bio: string; city: string; genre: string[]; tags: string[];
  } | null>(null);

  useEffect(() => {
    fetch(`/content/artists/${slug}.json`)
      .then((r) => r.ok ? r.json() : null)
      .then(setArtistData)
      .catch(() => setArtistData(null));
  }, [slug]);

  const artistArticles = useMemo(
    () => articles.filter((a) =>
      a.artists.some((ar) => ar.toLowerCase().replace(/\s+/g, "-") === slug)
    ),
    [articles, slug]
  );

  const displayName = artistData?.name || slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";

  return (
    <div className="min-h-screen font-sans">
      <SEO
        title={displayName}
        description={artistData?.bio || `Článků o ${displayName}`}
        url={`/artist/${slug}`}
      />
      <Header onSearch={() => {}} />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => navigate("/")} className="neo-button bg-white text-black px-4 py-2 font-heading text-sm uppercase mb-8">← Zpět</button>

        <div className="bg-white neo-border neo-shadow p-8 mb-10 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-5xl">🎤</span>
            <h1 className="font-heading text-4xl uppercase">{displayName}</h1>
            {artistData?.city && <span className="font-bold text-gray-500">📍 {artistData.city}</span>}
          </div>
          {artistData?.bio && <p className="text-lg font-medium text-gray-700 leading-relaxed">{artistData.bio}</p>}
          {artistData?.tags && artistData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {artistData.tags.map((t) => (
                <button key={t} onClick={() => navigate(`/tag/${t}`)} className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border hover:bg-black hover:text-[#FFD800] transition-colors">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="font-heading text-2xl uppercase mb-6 border-b-4 border-black pb-3">
          Články o {displayName} ({artistArticles.length})
        </h2>
        {artistArticles.length === 0 ? (
          <p className="font-heading text-xl uppercase text-black/50">Zatím žádné články.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {artistArticles.map((a) => <ArticleCard key={a.slug} article={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────

function Header({ onSearch }: { onSearch: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black px-6 py-4 flex justify-between items-center gap-3">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 font-heading text-xl uppercase text-[#39FF14] hover:text-white transition-colors"
      >
        <Hash size={24} className="text-[#39FF14]" />
        4RAP
      </button>
      <button
        onClick={onSearch}
        className="flex items-center gap-2 neo-button bg-[#39FF14] text-black px-4 py-2 font-heading text-sm uppercase"
      >
        <Search size={16} /> Hledat
        <span className="hidden md:inline text-xs opacity-60 ml-1">⌘K</span>
      </button>
    </header>
  );
}

// ── Homepage ──────────────────────────────────────────────

function EmptyState({ category }: { category: string }) {
  return (
    <div className="bg-white neo-border neo-shadow p-12 text-center flex flex-col gap-4">
      <div className="font-heading text-5xl">📭</div>
      <p className="font-heading text-2xl uppercase">
        {category === "Vše" ? "Žádné články zatím." : `Žádné články v kategorii „${category}".`}
      </p>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-2">
      <h2 className="font-heading text-xl uppercase shrink-0">{label}</h2>
      <div className="flex-1 h-1 bg-black" />
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("Vše");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const articles = useMemo(() => loadArticles(), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const filtered = useMemo(() => {
    let result = articles;
    if (activeCategory !== "Vše") result = result.filter((a) => a.category === activeCategory);
    if (activeTags.length > 0) result = result.filter((a) => activeTags.every((t) => a.tags.includes(t)));
    return result;
  }, [articles, activeCategory, activeTags]);

  const featuredArticles = useMemo(() => articles.filter((a) => a.featured), [articles]);
  const latestArticles = useMemo(() => articles.slice(0, 4), [articles]);
  const isFiltered = activeCategory !== "Vše" || activeTags.length > 0;

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).slice(0, 20);
  }, [articles]);

  return (
    <div className="min-h-screen font-sans">
      <SEO />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Header onSearch={() => setSearchOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">

        {/* Hero */}
        <div className="bg-black text-[#FFDE00] neo-border neo-shadow p-8 lg:p-12">
          <h1 className="font-heading text-5xl lg:text-7xl uppercase leading-none mb-4">
            Český<br />Rap<br />Vesmír
          </h1>
          <p className="font-sans text-lg font-medium text-[#FFDE00]/80 max-w-md">
            Profily raperů, recenze, návody, drama. Všechno co se děje na české scéně.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <FilterButton key={cat} isActive={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
              {cat}
            </FilterButton>
          ))}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs font-bold uppercase px-3 py-1 neo-border transition-colors
                  ${activeTags.includes(tag) ? "bg-black text-[#FFD800]" : "bg-[#FFD800] text-black hover:bg-black hover:text-[#FFD800]"}`}
              >
                #{tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="flex items-center gap-1 text-xs font-bold uppercase px-3 py-1 neo-border bg-[#FF4A4A] text-white"
              >
                <X size={12} /> Zrušit filtry
              </button>
            )}
          </div>
        )}

        {/* Active filter info */}
        {isFiltered && (
          <p className="font-bold text-sm text-black/60 uppercase">
            {filtered.length} článků
            {activeCategory !== "Vše" ? ` v kategorii ${activeCategory}` : ""}
            {activeTags.length > 0 ? ` · tagy: ${activeTags.join(", ")}` : ""}
          </p>
        )}

        {/* Filtered view */}
        {isFiltered ? (
          filtered.length === 0 ? (
            <EmptyState category={activeCategory} />
          ) : (
            <div className="flex flex-col gap-6">
              {filtered.map((a) => <ArticleCard key={a.slug} article={a} onTagClick={toggleTag} />)}
            </div>
          )
        ) : (
          /* Homepage sections */
          <div className="flex flex-col gap-10">
            {/* Featured */}
            {featuredArticles.length > 0 && (
              <section>
                <SectionDivider label="⭐ Editorial Picks" />
                <div className="flex flex-col gap-6 mt-4">
                  {featuredArticles.map((a) => <ArticleCard key={a.slug} article={a} onTagClick={toggleTag} />)}
                </div>
              </section>
            )}

            {/* Latest */}
            <section>
              <SectionDivider label="🔥 Nejnovější" />
              <div className="flex flex-col gap-6 mt-4">
                {latestArticles.map((a) => <ArticleCard key={a.slug} article={a} onTagClick={toggleTag} />)}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
      <Route path="/tag/:tag" element={<TagPage />} />
      <Route path="/artist/:slug" element={<ArtistPage />} />
    </Routes>
  );
}
