import { useState, useMemo, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
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
  Návody: "bg-[#7BC8A4] text-black",
  Články: "bg-[#00BFFF] text-black",
};

const CATEGORY_DOT: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A]",
  Návody: "bg-[#7BC8A4]",
  Články: "bg-[#00BFFF]",
};

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

function getTrending(articles: Article[], count = 5): Article[] {
  const now = Date.now();

  return [...articles]
    .map((a) => {
      const age = a.date ? (now - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24) : 999;
      const recencyScore = Math.max(0, 30 - age);
      const tagScore = a.tags.length * 2;

      return {
        a,
        score: recencyScore + tagScore + (a.featured ? 10 : 0),
      };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map((x) => x.a);
}

function Header({ onSearch, unreadCount }: { onSearch: () => void; unreadCount: number }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black px-4 sm:px-5 py-3 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 overflow-hidden">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 font-heading text-lg sm:text-xl uppercase text-[#7BC8A4] hover:text-white transition-colors shrink-0"
      >
        <Hash size={20} className="text-[#7BC8A4] shrink-0" />
        <span>4RAP</span>
      </button>

      <div className="flex items-center justify-end gap-2 w-full sm:w-auto min-w-0">
        {unreadCount > 0 && (
          <span className="font-heading text-[10px] bg-[#7BC8A4] text-black px-2 py-0.5 border border-black/60 shrink-0">
            {unreadCount} NEW
          </span>
        )}

        <button
          onClick={onSearch}
          className="flex items-center justify-center gap-2 neo-button bg-[#7BC8A4] text-black px-3 sm:px-4 py-2 font-heading text-xs sm:text-sm uppercase min-w-0 w-full sm:w-auto"
        >
          <Search size={14} className="shrink-0" />
          <span className="truncate">Hledat</span>
        </button>
      </div>
    </header>
  );
}

function HeroArticle({ article, onOpen }: { article: Article; onOpen: () => void }) {
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <section
      className="relative bg-black text-white neo-border neo-shadow cursor-pointer group overflow-hidden rounded-sm"
      onClick={onOpen}
      style={{ minHeight: 320 }}
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

      <div className="relative z-10 p-5 sm:p-6 lg:p-14 flex flex-col justify-end h-full min-h-[320px]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <span className="bg-[#FFD800] text-black px-3 py-1 font-bold uppercase text-[10px] sm:text-xs border-2 border-black">
            ★ Featured
          </span>

          <span
            className={`px-3 py-1 font-bold uppercase text-[10px] sm:text-xs border-2 border-black ${CATEGORY_COLORS[article.category] || "bg-white text-black"}`}
          >
            {article.category}
          </span>

          {formattedDate && (
            <span className="text-white/50 text-[10px] sm:text-xs font-bold uppercase">
              {formattedDate}
            </span>
          )}
        </div>

        <h1 className="font-heading text-[2rem] sm:text-5xl lg:text-6xl uppercase leading-[0.95] mb-4 max-w-4xl group-hover:text-[#FFD800] transition-colors text-balance">
          {article.title}
        </h1>

        <p className="text-white/75 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed mb-5 line-clamp-3 sm:line-clamp-none">
          {article.excerpt}
        </p>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-xs font-bold uppercase px-2 py-0.5 bg-white/10 border border-white/20 text-white/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrendingPanel({
  articles,
  readSet,
  onOpen,
}: {
  articles: Article[];
  readSet: Set<string>;
  onOpen: (slug: string) => void;
}) {
  if (!articles.length) return null;

  return (
    <aside className="bg-white neo-border neo-shadow flex flex-col overflow-hidden">
      <div className="border-b-4 border-black px-4 sm:px-5 py-3 flex items-center gap-2">
        <Flame size={16} className="text-[#FF4A4A] shrink-0" />
        <span className="font-heading text-sm uppercase truncate">Trending this week</span>
      </div>

      <div className="flex flex-col divide-y-4 divide-black">
        {articles.map((a, i) => {
          const isUnread = !readSet.has(a.slug);

          return (
            <button
              key={a.slug}
              className="p-4 text-left hover:bg-[#FFD800] transition-colors flex gap-3 items-start min-w-0"
              onClick={() => onOpen(a.slug)}
            >
              <span className="font-heading text-2xl text-black/20 shrink-0 leading-none mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[a.category] || "bg-gray-400"}`} />

                  <span className="font-heading text-xs uppercase text-black/50 truncate">
                    {a.category}
                  </span>

                  {isUnread && (
                    <span className="text-[9px] font-bold bg-[#7BC8A4] border border-black/40 px-1 uppercase tracking-wide opacity-80 shrink-0">
                      NEW
                    </span>
                  )}
                </div>

                <span className="font-heading text-sm uppercase leading-tight line-clamp-2 break-words">
                  {a.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

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
    ? new Date(article.date).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <article
      onClick={onOpen}
      className="bg-white neo-border neo-shadow flex flex-col cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-100 overflow-hidden min-w-0"
    >
      {article.coverImage ? (
        <div className="w-full aspect-[16/9] overflow-hidden border-b-4 border-black bg-black/5">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 uppercase border-2 border-black shrink-0 ${colorClass}`}
          >
            {article.category}
          </span>

          <span className="text-xs font-bold text-black/40 truncate">
            {formattedDate}
          </span>

          {isUnread && (
            <span className="text-[9px] font-bold px-1 py-px bg-[#7BC8A4] border border-black uppercase tracking-wide shrink-0">
              NEW
            </span>
          )}

          {article.featured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#FFD800] border-2 border-black uppercase shrink-0">
              ★
            </span>
          )}
        </div>

        <h2 className="font-heading text-base sm:text-lg uppercase leading-tight line-clamp-3 flex-1 break-words">
          {article.title}
        </h2>

        {!article.coverImage && article.excerpt && (
          <p className="text-sm font-medium text-gray-600 leading-relaxed line-clamp-3 break-words">
            {article.excerpt}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#FFD800] border border-black"
              >
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

        {article.readingTime > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-black/30 uppercase mt-auto pt-2 border-t-2 border-black/10">
            <Clock size={10} className="shrink-0" />
            {article.readingTime} min
          </div>
        )}
      </div>
    </article>
  );
}

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
  const activeCount =
    (activeCategory !== "Vše" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    activeTags.length +
    (feedMode === "unread" ? 1 : 0);

  return (
    <div className="bg-white neo-border neo-shadow overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-4 border-black">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <h2 className="font-heading text-lg sm:text-xl uppercase shrink-0">Feed</h2>

          <span className="font-heading text-xs sm:text-sm text-black/40 border-2 border-black/20 px-2 py-0.5 shrink-0">
            {total} článků
          </span>

          {activeCount > 0 && (
            <span className="font-heading text-xs bg-[#FF4A4A] text-white border-2 border-black px-2 py-0.5 shrink-0">
              {activeCount} filtrů
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setFeedMode(feedMode === "all" ? "unread" : "all")}
            className={`neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center justify-center gap-1.5 flex-1 sm:flex-none ${feedMode === "unread" ? "bg-black text-[#7BC8A4]" : "bg-white text-black"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${feedMode === "unread" ? "bg-[#7BC8A4]" : "bg-black/30"}`} />
            Nepřečtené
          </button>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center justify-center gap-1.5 flex-1 sm:flex-none ${filterOpen ? "bg-black text-white" : "bg-white text-black"}`}
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
              className="neo-button px-3 py-1.5 font-heading text-xs uppercase flex items-center justify-center gap-1 bg-[#FF4A4A] text-white flex-1 sm:flex-none"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 sm:px-5 py-4 flex flex-col gap-4 border-b-4 border-black bg-[#fffae8] overflow-hidden">
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs uppercase text-black/40">Kategorie</span>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`neo-button px-4 py-1.5 font-heading text-xs uppercase ${activeCategory === cat ? "bg-black text-white translate-x-[2px] translate-y-[2px] !shadow-none" : "bg-white text-black"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs uppercase text-black/40">Datum</span>

            <div className="flex flex-wrap gap-2">
              {(["all", "7d", "30d", "365d"] as DateFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`neo-button px-4 py-1.5 font-heading text-xs uppercase ${dateFilter === d ? "bg-black text-white translate-x-[2px] translate-y-[2px] !shadow-none" : "bg-white text-black"}`}
                >
                  {d === "all" ? "Vše" : d === "7d" ? "7 dní" : d === "30d" ? "30 dní" : "Rok"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
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
    <div className="min-h-screen font-sans overflow-x-clip">
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Header onSearch={() => setSearchOpen(true)} unreadCount={unreadCount} />
      {children}
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);

  const [activeCategory, setActiveCategory] = useState<Category>("Vše");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [readSet, setReadSet] = useState<Set<string>>(getReadSet);
  const [filterOpen, setFilterOpen] = useState(false);

  const featuredArticle = useMemo(
    () => articles.find((a) => a.featured) || articles[0],
    [articles]
  );

  const trending = useMemo(() => getTrending(articles, 5), [articles]);

  const unreadCount = useMemo(
    () => articles.filter((a) => !readSet.has(a.slug)).length,
    [articles, readSet]
  );

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

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
      result = result.filter((a) => !readSet.has(a.slug));
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

        return (now - new Date(a.date).getTime()) / 86400000 <= limits[dateFilter];
      });
    }

    return result.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [articles, activeCategory, activeTags, feedMode, dateFilter, readSet, featuredArticle]);

  const openArticle = useCallback(
    (slug: string) => {
      markRead(slug);
      setReadSet(getReadSet());
      navigate(`/article/${slug}`);
    },
    [navigate]
  );

  return (
    <AppShell unreadCount={unreadCount}>
      <SEO />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 overflow-hidden">
        {featuredArticle && (
          <HeroArticle
            article={featuredArticle}
            onOpen={() => openArticle(featuredArticle.slug)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start min-w-0">
          <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
              {filtered.map((a) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  isUnread={!readSet.has(a.slug)}
                  onOpen={() => openArticle(a.slug)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="bg-white neo-border neo-shadow p-8 sm:p-12 text-center overflow-hidden">
                <p className="font-heading text-xl sm:text-2xl uppercase text-black/30">
                  Žádné články
                </p>

                <p className="font-bold text-black/40 mt-2 text-sm sm:text-base">
                  Zkus jiný filtr nebo reset.
                </p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24 min-w-0">
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
