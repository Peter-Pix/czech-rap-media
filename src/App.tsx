import { useState, useMemo, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Hash, Search } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ArticlePage from "./ArticlePage";
import SearchOverlay from "./components/SearchOverlay";
import SEO from "./components/SEO";
import TagFilterBar from "./components/TagFilterBar";
import { getArtistMap, getTagMap, type ArtistEntry } from "./lib/metadata";

type Category = "Vše" | "Rapeři" | "Návody" | "Články";
type FeedMode = "all" | "unread";
type DateFilter = "all" | "7d" | "30d" | "365d";

const CATEGORIES: Category[] = ["Vše", "Rapeři", "Návody", "Články"];

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

const slugifyArtist = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "-");

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

const ArticleCard = ({ article, unread }: { article: Article; unread?: boolean }) => {
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

        {unread && (
          <span className="font-bold text-xs px-2 py-0.5 bg-[#39FF14] neo-border uppercase">
            NEW
          </span>
        )}

        {article.featured && (
          <span className="font-bold text-xs px-2 py-0.5 bg-[#FFD800] neo-border uppercase">Featured</span>
        )}
      </div>

      <h2 className="font-heading text-2xl lg:text-3xl tracking-wide uppercase leading-tight">
        {article.title}
      </h2>

      <p className="font-sans font-medium text-lg text-gray-700 leading-[1.9]">
        {article.excerpt}
      </p>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <div className="min-h-screen font-sans">
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Header onSearch={() => setSearchOpen(true)} />
      {children}
    </div>
  );
}

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
      </button>
    </header>
  );
}

function HomePage() {
  const articles = useMemo(() => loadArticles(), []);

  const [activeCategory, setActiveCategory] = useState<Category>("Vše");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [readArticles, setReadArticles] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("read_articles");
    if (stored) {
      try {
        setReadArticles(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const featuredArticle = useMemo(() => {
    return articles.find((a) => a.featured) || articles[0];
  }, [articles]);

  const filtered = useMemo(() => {
    let result = [...articles];

    if (featuredArticle) {
      result = result.filter((a) => a.slug !== featuredArticle.slug);
    }

    if (activeCategory !== "Vše") {
      result = result.filter((a) => a.category === activeCategory);
    }

    if (activeTags.length > 0) {
      result = result.filter((a) => activeTags.every((t) => a.tags.includes(t)));
    }

    if (feedMode === "unread") {
      result = result.filter((a) => !readArticles.includes(a.slug));
    }

    if (dateFilter !== "all") {
      const now = Date.now();
      const limits: Record<string, number> = {
        "7d": 7,
        "30d": 30,
        "365d": 365,
      };

      result = result.filter((a) => {
        if (!a.date) return false;
        const diff = now - new Date(a.date).getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days <= limits[dateFilter];
      });
    }

    return result.sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  }, [articles, activeCategory, activeTags, feedMode, dateFilter, readArticles, featuredArticle]);

  return (
    <AppShell>
      <SEO />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">

        {featuredArticle && (
          <section
            className="bg-black text-white neo-border neo-shadow p-8 lg:p-12 cursor-pointer"
            onClick={() => window.location.href = `#/article/${featuredArticle.slug}`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="bg-[#FFD800] text-black px-3 py-1 neo-border font-bold uppercase text-sm">
                Featured Article
              </span>
              <span className="text-sm uppercase text-white/60">
                {featuredArticle.category}
              </span>
            </div>

            <h1 className="font-heading text-4xl lg:text-6xl uppercase leading-none mb-5 max-w-4xl">
              {featuredArticle.title}
            </h1>

            <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
              {featuredArticle.excerpt}
            </p>
          </section>
        )}

        <section className="bg-white neo-border neo-shadow p-5 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl uppercase">Feed</h2>
              <p className="text-sm font-bold uppercase text-black/50">
                {filtered.length} článků
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton isActive={feedMode === "all"} onClick={() => setFeedMode("all")}>
                Vše
              </FilterButton>

              <FilterButton isActive={feedMode === "unread"} onClick={() => setFeedMode("unread")}>
                Nepřečtené
              </FilterButton>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <FilterButton
                key={cat}
                isActive={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </FilterButton>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <FilterButton isActive={dateFilter === "all"} onClick={() => setDateFilter("all")}>
              Všechny data
            </FilterButton>

            <FilterButton isActive={dateFilter === "7d"} onClick={() => setDateFilter("7d")}>
              7 dní
            </FilterButton>

            <FilterButton isActive={dateFilter === "30d"} onClick={() => setDateFilter("30d")}>
              30 dní
            </FilterButton>

            <FilterButton isActive={dateFilter === "365d"} onClick={() => setDateFilter("365d")}>
              Rok
            </FilterButton>
          </div>

          <TagFilterBar
            articles={articles}
            activeTags={activeTags}
            onToggleTag={toggleTag}
            onClearTags={() => setActiveTags([])}
            initialLimit={10}
          />
        </section>

        <section className="flex flex-col gap-6">
          {filtered.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              unread={!readArticles.includes(article.slug)}
            />
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function TagPage() {
  const { tag = "" } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);
  const [knownTags, setKnownTags] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTagMap().then((map) => {
      if (!cancelled) setKnownTags(new Set(Object.keys(map)));
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => articles.filter((a) => a.tags.includes(tag)),
    [articles, tag]
  );

  const isKnownTag = knownTags === null || knownTags.has(tag);

  return <AppShell><main className="max-w-5xl mx-auto px-4 md:px-8 py-10"><button onClick={() => navigate("/")} className="neo-button bg-white text-black px-4 py-2 font-heading text-sm uppercase">← Zpět</button><div className="mt-8">{!isKnownTag ? <p>Tag neexistuje.</p> : filtered.map((a) => <ArticleCard key={a.slug} article={a} />)}</div></main></AppShell>;
}

function ArtistPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const articles = useMemo(() => loadArticles(), []);
  const [artistData, setArtistData] = useState<ArtistEntry | null>(null);

  useEffect(() => {
    getArtistMap().then((map) => setArtistData(map[slug] ?? null));
  }, [slug]);

  const artistArticles = useMemo(
    () => articles.filter((a) => a.artists.some((ar) => slugifyArtist(ar) === slug)),
    [articles, slug]
  );

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6">
        <h1 className="font-heading text-4xl uppercase">{artistData?.name || slug}</h1>
        {artistArticles.map((a) => <ArticleCard key={a.slug} article={a} />)}
      </main>
    </AppShell>
  );
}

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
