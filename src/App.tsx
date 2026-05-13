import { useState, useMemo, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Hash, Search, Flame, Clock, Filter, X, ChevronDown, Sun, Moon } from "lucide-react";
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
  Rapeři: "bg-accent text-ink-inverse",
  Návody: "bg-blue-600 text-white dark:bg-blue-500",
  Články: "bg-violet-600 text-white dark:bg-violet-500",
};

const CATEGORY_DOT: Record<string, string> = {
  Rapeři: "bg-accent",
  Návody: "bg-blue-600 dark:bg-blue-500",
  Články: "bg-violet-600 dark:bg-violet-500",
};

// Theme utilities
function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("crm_theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme: "light" | "dark") {
  localStorage.setItem("crm_theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  
  useEffect(() => {
    const initialTheme = getTheme();
    setThemeState(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);
  
  const toggle = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);
    setTheme(newTheme);
  }, [theme]);
  
  return { theme, toggle };
}

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

function Header({ onSearch, unreadCount, theme, onToggleTheme }: { onSearch: () => void; unreadCount: number; theme: "light" | "dark"; onToggleTheme: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b px-3 sm:px-5 py-2.5 sm:py-3 flex justify-between items-center gap-2 sm:gap-3">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 font-heading text-lg sm:text-xl uppercase text-accent hover:opacity-80 transition-opacity shrink-0"
      >
        <Hash size={18} className="sm:w-5 sm:h-5 shrink-0" />
        <span>4RAP</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {unreadCount > 0 && (
          <span className="font-heading text-[10px] sm:text-xs bg-accent text-paper px-2 py-1 rounded shrink-0">
            {unreadCount}
          </span>
        )}

        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary hover:bg-border transition-colors"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Moon size={16} className="sm:w-[18px] sm:h-[18px] text-ink" />
          ) : (
            <Sun size={16} className="sm:w-[18px] sm:h-[18px] text-ink" />
          )}
        </button>

        <button
          onClick={onSearch}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent hover:bg-accent-hover text-paper transition-colors"
          aria-label="Search"
        >
          <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
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
      className="relative bg-card text-ink neo-border neo-shadow cursor-pointer group overflow-hidden rounded-lg sm:rounded-xl transition-all hover:shadow-lg"
      onClick={onOpen}
    >
      {article.coverImage && (
        <div className="absolute inset-0">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover opacity-50 dark:opacity-40 group-hover:opacity-60 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10 p-4 sm:p-6 lg:p-10 flex flex-col justify-end min-h-[260px] sm:min-h-[320px]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span className="bg-accent text-paper px-2 sm:px-2.5 py-1 font-bold uppercase text-[10px] sm:text-xs rounded">
            Featured
          </span>

          <span
            className={`px-2 sm:px-2.5 py-1 font-bold uppercase text-[10px] sm:text-xs rounded ${CATEGORY_COLORS[article.category] || "bg-secondary text-ink"}`}
          >
            {article.category}
          </span>

          {formattedDate && (
            <span className="text-muted text-[10px] sm:text-xs font-medium uppercase">
              {formattedDate}
            </span>
          )}
        </div>

        <h1 className="font-heading text-xl sm:text-3xl lg:text-4xl uppercase leading-[1.1] mb-2 sm:mb-3 group-hover:text-accent transition-colors">
          {article.title}
        </h1>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 max-w-2xl">
          {article.excerpt}
        </p>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-xs font-medium uppercase px-2 py-1 bg-secondary/80 text-muted rounded"
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
    <aside className="bg-white neo-border neo-shadow flex flex-col overflow-hidden rounded-xl">
      <div className="border-b border-[#e5e5e5] px-5 sm:px-6 py-4 flex items-center gap-2">
        <Flame size={18} className="text-[#ff5a2e] shrink-0" />
        <span className="font-heading text-sm uppercase text-slate-900 truncate">Trending this week</span>
      </div>

      <div className="flex flex-col divide-y divide-[#e5e5e5]">
        {articles.map((a, i) => {
          const isUnread = !readSet.has(a.slug);

          return (
            <button
              key={a.slug}
              className="p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors flex gap-3 items-start min-w-0"
              onClick={() => onOpen(a.slug)}
            >
              <span className="font-heading text-2xl text-slate-300 shrink-0 leading-none mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[a.category] || "bg-slate-300"}`} />

                  <span className="font-heading text-xs uppercase text-slate-600 truncate">
                    {a.category}
                  </span>

                  {isUnread && (
                    <span className="text-xs font-bold bg-[#ff5a2e] text-white border border-[#ff5a2e] px-1.5 py-0.5 uppercase tracking-wide rounded-sm shrink-0">
                      NEW
                    </span>
                  )}
                </div>

                <span className="font-heading text-sm uppercase leading-tight line-clamp-2 break-words text-slate-900">
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
  const colorClass = CATEGORY_COLORS[article.category] || "bg-slate-200 text-slate-900";

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
      className="bg-white neo-border neo-shadow flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden min-w-0 rounded-xl"
    >
      {article.coverImage ? (
        <div className="w-full aspect-[16/9] overflow-hidden border-b border-[#e5e5e5] bg-slate-100">
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
            className={`text-xs font-bold px-2.5 py-1 uppercase rounded-md shrink-0 ${colorClass}`}
          >
            {article.category}
          </span>

          <span className="text-xs font-medium text-slate-500 truncate">
            {formattedDate}
          </span>

          {isUnread && (
            <span className="text-xs font-bold px-2 py-1 bg-[#ff5a2e] text-white uppercase rounded-md tracking-wide shrink-0">
              NEW
            </span>
          )}

          {article.featured && (
            <span className="text-sm font-bold px-2 py-1 bg-[#ffd966] text-slate-900 rounded-md uppercase shrink-0">
              ★
            </span>
          )}
        </div>

        <h2 className="font-heading text-base sm:text-lg uppercase leading-tight line-clamp-3 flex-1 break-words text-slate-900">
          {article.title}
        </h2>

        {!article.coverImage && article.excerpt && (
          <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-3 break-words">
            {article.excerpt}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium uppercase px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md"
              >
                #{tag}
              </span>
            ))}

            {article.tags.length > 3 && (
              <span className="text-xs font-medium uppercase px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {article.readingTime > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase mt-auto pt-3 border-t border-slate-200">
            <Clock size={12} className="shrink-0" />
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
    <div className="bg-white neo-border neo-shadow overflow-hidden rounded-xl">
      <div className="px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <h2 className="font-heading text-lg sm:text-xl uppercase text-slate-900 shrink-0">Feed</h2>

          <span className="font-heading text-xs sm:text-sm text-slate-600 border border-slate-300 px-3 py-1 rounded-md shrink-0">
            {total} články
          </span>

          {activeCount > 0 && (
            <span className="font-heading text-xs bg-[#ff5a2e] text-white px-3 py-1 rounded-md shrink-0">
              {activeCount} filtrů
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setFeedMode(feedMode === "all" ? "unread" : "all")}
            className={`neo-button px-4 py-2 font-medium text-xs uppercase flex items-center justify-center gap-1.5 flex-1 sm:flex-none rounded-lg transition-all ${feedMode === "unread" ? "bg-[#ff5a2e] text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${feedMode === "unread" ? "bg-white" : "bg-slate-400"}`} />
            Nepřečtené
          </button>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`neo-button px-4 py-2 font-medium text-xs uppercase flex items-center justify-center gap-1.5 flex-1 sm:flex-none rounded-lg transition-all ${filterOpen ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
          >
            <Filter size={14} />
            Filtr
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>

          {activeCount > 0 && (
            <button
              onClick={() => {
                setActiveCategory("Vše");
                setDateFilter("all");
                setFeedMode("all");
                clearTags();
              }}
              className="neo-button px-4 py-2 font-medium text-xs uppercase flex items-center justify-center gap-1 bg-[#ff5a2e] text-white hover:bg-[#e63d0a] flex-1 sm:flex-none rounded-lg transition-all"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {filterOpen && (
        <div className="px-5 sm:px-6 py-5 flex flex-col gap-5 border-b border-[#e5e5e5] bg-slate-50 overflow-hidden">
          <div className="flex flex-col gap-3">
            <span className="font-heading text-xs uppercase text-slate-700 font-semibold">Kategorie</span>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`neo-button px-4 py-2 font-medium text-xs uppercase rounded-lg transition-all ${activeCategory === cat ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-slate-200 hover:border-slate-300"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-heading text-xs uppercase text-slate-700 font-semibold">Datum</span>

            <div className="flex flex-wrap gap-2">
              {(["all", "7d", "30d", "365d"] as DateFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`neo-button px-4 py-2 font-medium text-xs uppercase rounded-lg transition-all ${dateFilter === d ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-slate-200 hover:border-slate-300"}`}
                >
                  {d === "all" ? "Vše" : d === "7d" ? "7 dní" : d === "30d" ? "30 dní" : "Rok"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-0">
            <span className="font-heading text-xs uppercase text-slate-700 font-semibold">Tagy</span>

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
    <div className="min-h-screen font-sans overflow-x-clip bg-white">
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {featuredArticle && (
          <HeroArticle
            article={featuredArticle}
            onOpen={() => openArticle(featuredArticle.slug)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start min-w-0">
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4 w-full">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
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
              <div className="bg-white neo-border neo-shadow p-6 sm:p-10 text-center overflow-hidden rounded-lg">
                <p className="font-heading text-lg sm:text-xl uppercase text-slate-400">
                  Žádné články
                </p>

                <p className="font-medium text-slate-500 mt-2 text-sm">
                  Zkus jiný filtr nebo reset.
                </p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 min-w-0">
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
