import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Hash, Search, Flame, Clock, Filter, X, ChevronDown } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ArticlePage from "./ArticlePage";
import SearchOverlay from "./components/SearchOverlay";
import SEO from "./components/SEO";
import TagFilterBar from "./components/TagFilterBar";

type Category = "Vše" | "Rapeři" | "Návody" | "Články";
type DateFilter = "all" | "7d" | "30d" | "365d";
type FeedMode = "all" | "unread";

const CATEGORIES: Category[] = ["Vše", "Rapeři", "Návody", "Články"];

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

const CATEGORY_DOT: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A]",
  Návody: "bg-[#39FF14]",
  Články: "bg-[#00BFFF]",
};

const PAGE_SIZE = 12;

// ── Read tracking ──────────────────────────────────────────────
function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem("crm_read");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
function markRead(slug: string) {
  const s = getReadSet();
  s.add(slug);
  localStorage.setItem("crm_read", JSON.stringify([...s]));
}

// ── Trending: most tags match, recency weighted ─────────────────
function getTrending(articles: Article[], count = 5): Article[] {
  const now = Date.now();
  return [...articles]
    .map((a) => {
      const age = a.date ? (now - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24) : 999;
      const recencyScore = Math.max(0, 30 - age);
      const tagScore = a.tags.length * 2;
      return { a, score: recencyScore + tagScore + (a.featured ? 10 : 0) };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map((x) => x.a);
}

// ── News ticker items ──────────────────────────────────────────
function buildTickerItems(articles: Article[]): string[] {
  return articles.slice(0, 8).map((a) => `${a.category.toUpperCase()} · ${a.title}`);
}

// ── NewsTicker ─────────────────────────────────────────────────
function NewsTicker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="bg-black text-[#39FF14] border-b-4 border-black overflow-hidden h-9 flex items-center">
      <span className="font-heading text-xs uppercase px-3 border-r-4 border-[#39FF14] whitespace-nowrap h-full flex items-center shrink-0">
        BREAKING
      </span>
      <div className="ticker-track flex items-center gap-0">
        {doubled.map((item, i) => (
          <span key={i} className="font-heading text-xs uppercase whitespace-nowrap px-8">
            {item}
            <span className="ml-8 text-[#FFD800]">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────
function Header({ onSearch, unreadCount }: { onSearch: () => void; unreadCount: number }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black px-5 py-3 flex justify-between items-center gap-3">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 font-heading text-xl uppercase text-[#39FF14] hover:text-white transition-colors"
      >
        <Hash size={22} className="text-[#39FF14]" />
        4RAP
      </button>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <span className="font-heading text-xs bg-[#39FF14] text-black px-2 py-0.5 border-2 border-black">
            {unreadCount} NEW
          </span>
        )}
        <button
          onClick={onSearch}
          className="flex items-center gap-2 neo-button bg-[#39FF14] text-black px-4 py-2 font-heading text-sm uppercase"
        >
          <Search size={14} /> Hledat
        </button>
      </div>
    </header>
  );
}

// ── Hero (featured) ────────────────────────────────────────────
function HeroArticle({ article, onOpen }: { article: Article; onOpen: () => void }) {
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <section
      className="relative bg-black text-white neo-border neo-shadow cursor-pointer group overflow-hidden"
      onClick={onOpen}
      style={{ minHeight: 360 }}
    >
      {article.coverImage && (
        <div className="absolute inset-0">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>
      )}
      <div className="relative z-10 p-8 lg:p-14 flex flex-col justify-end h-full" style={{ minHeight: 360 }}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="bg-[#FFD800] text-black px-3 py-1 font-bold uppercase text-xs border-2 border-black">
            ★ FEATURED
          </span>
          <span className={`px-3 py-1 font-bold uppercase text-xs border-2 border-black ${CATEGORY_COLORS[article.category] || "bg-white text-black"}`}>
            {article.category}
          </span>
          {formattedDate && <span className="text-white/50 text-xs font-bold uppercase">{formattedDate}</span>}
        </div>
        <h1 className="font-heading text-4xl lg:text-6xl uppercase leading-none mb-4 max-w-4xl group-hover:text-[#FFD800] transition-colors">
          {article.title}
        </h1>
        <p className="text-white/70 text-lg max-w-2xl leading-relaxed mb-5">
          {article.excerpt}
        </p>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-xs font-bold uppercase px-2 py-0.5 bg-white/10 border border-white/20 text-white/60">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Trending sidebar ───────────────────────────────────────────
function TrendingPanel({ articles, readSet, onOpen }: { articles: Article[]; readSet: Set<string>; onOpen: (slug: string) => void }) {
  if (!articles.length) return null;
  return (
    <aside className="bg-white neo-border neo-shadow flex flex-col">
      <div className="border-b-4 border-black px-5 py-3 flex items-center gap-2">
        <Flame size={16} className="text-[#FF4A4A]" />
        <span className="font-heading text-sm uppercase">Trending this week</span>
      </div>
      <div className="flex flex-col divide-y-4 divide-black">
        {articles.map((a, i) => {
          const isUnread = !readSet.has(a.slug);
          return (
            <button
              key={a.slug}
              className="p-4 text-left hover:bg-[#FFD800] transition-colors flex gap-3 items-start"
              onClick={() => onOpen(a.slug)}
            >
              <span className="font-heading text-2xl text-black/20 shrink-0 leading-none mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[a.category] || "bg-gray-400"}`} />
                  <span className="font-heading text-xs uppercase text-black/50">{a.category}</span>
                  {isUnread && (
                    <span className="text-[10px] font-bold bg-[#39FF14] border border-black px-1 uppercase">NEW</span>
                  )}
                </div>
                <span className="font-heading text-sm uppercase leading-tight line-clamp-2">{a.title}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ── Article card (masonry-friendly) ───────────────────────────
function ArticleCard({
  article,
  isUnread,
  onOpen,
}: {
  article: Article;
  isUnread: boolean;
  onOpen: () => void;
}) {
  const colorClass = CATEGORY_COLORS[article.category] || "bg-gray-200 text-black";
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
    : "";

  return (
    <article
      onClick={onOpen}
      className="bg-white neo-border neo-shadow flex flex-col cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-100 overflow-hidden"
    >
      {/* Cover thumbnail */}
      {article.coverImage ? (
        <div className="w-full aspect-[16/9] overflow-hidden border-b-4 border-black">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={`w-full aspect-[16/9] border-b-4 border-black flex items-center justify-center text-4xl font-heading opacity-10 ${colorClass}`}>
          #
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 uppercase border-2 border-black ${colorClass}`}>
            {article.category}
          </span>
          <span className="text-xs font-bold text-black/40">{formattedDate}</span>
          {isUnread && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#39FF14] border-2 border-black uppercase">
              NEW
            </span>
          )}
          {article.featured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#FFD800] border-2 border-black uppercase">
              ★
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-heading text-lg uppercase leading-tight line-clamp-3 flex-1">
          {article.title}
        </h2>

        {/* Excerpt — only show if no cover image (save space) */}
        {!article.coverImage && article.excerpt && (
          <p className="text-sm font-medium text-gray-600 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#FFD800] border border-black">
                #{tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-black/5 border border-black/20">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Reading time */}
        {article.readingTime > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-black/30 uppercase mt-auto pt-1 border-t-2 border-black/10">
            <Clock size={10} />
            {article.readingTime} min
          </div>
        )}
      </div>
    </article>
  );
}

// ── FeedHeader ─────────────────────────────────────────────────
function FeedHeader({
  total,
  feedMode,
  setFeedMode,
  activeCategory,
  setActiveCategory,
  dateFilter,
  setDateFilter,
  activeTags,
  toggleTag,
  clearTags,
  allArticles,
  filterOpen,
  setFilterOpen,
}: {
  total: number;
  feedMode: FeedMode;
  setFeedMode: (m: FeedMode) => void;
  activeCategory: Category;
  setActiveCategory: (c: Category) => void;
  dateFilter: DateFilter;
  setDateFilter: (d: DateFilter) => void;
  activeTags: string[];
  toggleTag: (t: string) => void;
  clearTags: () => void;
  allArticles: Article[];
  filterOpen: boolean;
  setFilterOpen: (o: boolean) => void;
}) {
  const activeCount = (activeCategory !== "Vše" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0) + activeTags.length + (feedMode === "unread" ? 1 : 0);

  return (
    <div className="bg-white neo-border neo-shadow">
      {/* top bar */}
      <div className="px-5 py-4 flex items-center justify-between gap-4 border-b-4 border-black">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl uppercase">Feed</h2>
          <span className="font-heading text-sm text-black/40 border-2 border-black/20 px-2 py-0.5">
            {total} článků
          </span>
          {activeCount > 0 && (
            <span className="font-heading text-xs bg-[#FF4A4A] text-white border-2 border-black px-2 py-0.5">
              {activeCount} filtrů
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedMode(feedMode === "all" ? "unread" : "all")}
            className={`neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center gap-1.5
              ${feedMode === "unread" ? "bg-black text-[#39FF14]" : "bg-white text-black"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${feedMode === "unread" ? "bg-[#39FF14]" : "bg-black/30"}`} />
            Nepřečtené
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center gap-1.5
              ${filterOpen ? "bg-black text-white" : "bg-white text-black"}`}
          >
            <Filter size={12} />
            Filtr
            <ChevronDown size={12} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
          {activeCount > 0 && (
            <button
              onClick={() => {
                setActiveCategory("Vše");
                setDateFilter("all");
                setFeedMode("all");
                clearTags();
              }}
              className="neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center gap-1 bg-[#FF4A4A] text-white"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* expandable filter panel */}
      {filterOpen && (
        <div className="px-5 py-4 flex flex-col gap-4 border-b-4 border-black bg-[#fffae8]">
          {/* Categories */}
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs uppercase text-black/40">Kategorie</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`neo-button px-4 py-1.5 font-heading text-xs uppercase
                    ${activeCategory === cat ? "bg-black text-white translate-x-[2px] translate-y-[2px] !shadow-none" : "bg-white text-black"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs uppercase text-black/40">Datum</span>
            <div className="flex flex-wrap gap-2">
              {(["all", "7d", "30d", "365d"] as DateFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`neo-button px-4 py-1.5 font-heading text-xs uppercase
                    ${dateFilter === d ? "bg-black text-white translate-x-[2px] translate-y-[2px] !shadow-none" : "bg-white text-black"}`}
                >
                  {d === "all" ? "Vše" : d === "7d" ? "7 dní" : d === "30d" ? "30 dní" : "Rok"}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs uppercase text-black/40">Tagy</span>
            <TagFilterBar
              articles={allArticles}
              activeTags={activeTags}
              onToggleTag={toggleTag}
              onClearTags={clearTags}
              initialLimit={12}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── AppShell ───────────────────────────────────────────────────
function AppShell({ children, unreadCount }: { children: React.ReactNode; unreadCount: number }) {
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
      <Header onSearch={() => setSearchOpen(true)} unreadCount={unreadCount} />
      {children}
    </div>
  );
}

// ── HomePage ───────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);

  const [activeCategory, setActiveCategory] = useState<Category>("Vše");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [readSet, setReadSet] = useState<Set<string>>(getReadSet);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const featuredArticle = useMemo(
    () => articles.find((a) => a.featured) || articles[0],
    [articles]
  );

  const trending = useMemo(() => getTrending(articles, 5), [articles]);
  const tickerItems = useMemo(() => buildTickerItems(articles), [articles]);
  const unreadCount = useMemo(
    () => articles.filter((a) => !readSet.has(a.slug)).length,
    [articles, readSet]
  );

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let result = [...articles];

    // exclude featured from feed
    if (featuredArticle) result = result.filter((a) => a.slug !== featuredArticle.slug);

    if (activeCategory !== "Vše") result = result.filter((a) => a.category === activeCategory);
    if (activeTags.length > 0) result = result.filter((a) => activeTags.every((t) => a.tags.includes(t)));
    if (feedMode === "unread") result = result.filter((a) => !readSet.has(a.slug));
    if (dateFilter !== "all") {
      const now = Date.now();
      const limits: Record<string, number> = { "7d": 7, "30d": 30, "365d": 365 };
      result = result.filter((a) => {
        if (!a.date) return false;
        return (now - new Date(a.date).getTime()) / 86400000 <= limits[dateFilter];
      });
    }

    return result.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [articles, activeCategory, activeTags, feedMode, dateFilter, readSet, featuredArticle]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [activeCategory, activeTags, feedMode, dateFilter]);

  // infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page * PAGE_SIZE < filtered.length) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length, page]);

  const visibleArticles = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleArticles.length < filtered.length;

  const openArticle = useCallback((slug: string) => {
    markRead(slug);
    setReadSet(getReadSet());
    navigate(`/article/${slug}`);
  }, [navigate]);

  return (
    <AppShell unreadCount={unreadCount}>
      <SEO />

      {/* Sticky news ticker below header */}
      <NewsTicker items={tickerItems} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">

        {/* Hero */}
        {featuredArticle && (
          <HeroArticle
            article={featuredArticle}
            onOpen={() => openArticle(featuredArticle.slug)}
          />
        )}

        {/* Main grid: feed + trending sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Feed */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <FeedHeader
              total={filtered.length}
              feedMode={feedMode}
              setFeedMode={setFeedMode}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              activeTags={activeTags}
              toggleTag={toggleTag}
              clearTags={() => setActiveTags([])}
              allArticles={articles}
              filterOpen={filterOpen}
              setFilterOpen={setFilterOpen}
            />

            {/* Masonry-style responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleArticles.map((a) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  isUnread={!readSet.has(a.slug)}
                  onOpen={() => openArticle(a.slug)}
                />
              ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="bg-white neo-border neo-shadow p-12 text-center">
                <p className="font-heading text-2xl uppercase text-black/30">Žádné články</p>
                <p className="font-bold text-black/40 mt-2">Zkus jiný filtr nebo reset.</p>
              </div>
            )}

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="h-8 flex items-center justify-center">
              {hasMore && (
                <span className="font-heading text-xs uppercase text-black/30 animate-pulse">
                  Načítám další…
                </span>
              )}
            </div>
          </div>

          {/* Trending sidebar */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24">
            <TrendingPanel
              articles={trending}
              readSet={readSet}
              onOpen={(slug) => openArticle(slug)}
            />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

// ── Router ─────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:slug" element={<ArticlePageWrapper />} />
    </Routes>
  );
}

function ArticlePageWrapper() {
  return <ArticlePage onRead={markRead} />;
}
