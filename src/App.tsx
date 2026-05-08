import { useState, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Target, Headphones, BookOpen, Music, Hash } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ArticlePage from "./ArticlePage";

type Category = "Vše" | "Rapeři" | "Návody" | "Články";
const CATEGORIES: Category[] = ["Vše", "Rapeři", "Návody", "Články"];

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

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

const ArticleCard = ({ article }: { article: Article }) => {
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
      </div>
      <h2 className="font-heading text-2xl lg:text-3xl tracking-wide uppercase leading-tight">
        {article.title}
      </h2>
      <p className="font-sans font-medium text-lg text-gray-700 leading-relaxed">
        {article.excerpt}
      </p>
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {article.tags.map((tag) => (
            <span key={tag} className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

const EmptyState = ({ category }: { category: string }) => (
  <div className="bg-white neo-border neo-shadow p-12 text-center flex flex-col gap-4">
    <div className="font-heading text-5xl">📭</div>
    <p className="font-heading text-2xl uppercase">
      {category === "Vše" ? "Žádné články zatím." : `Žádné články v kategorii „${category}".`}
    </p>
    <p className="font-bold text-gray-500">Pipeline běží. Brzy přibudou.</p>
  </div>
);

function HomePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Vše");
  const allArticles = useMemo(() => loadArticles(), []);
  const filtered = activeCategory === "Vše" ? allArticles : allArticles.filter((a) => a.category === activeCategory);
  const counts = useMemo(() => ({
    Rapeři: allArticles.filter((a) => a.category === "Rapeři").length,
    Návody: allArticles.filter((a) => a.category === "Návody").length,
    Články: allArticles.filter((a) => a.category === "Články").length,
  }), [allArticles]);

  const icons: Record<Category, React.ReactNode> = {
    Vše: <Target size={18} />,
    Rapeři: <Headphones size={18} />,
    Návody: <Music size={18} />,
    Články: <BookOpen size={18} />,
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Hash size={32} className="text-[#39FF14]" />
          <span className="font-heading text-4xl uppercase tracking-tighter">4RAP</span>
        </div>
        <p className="font-bold text-base text-[#FFD800] tracking-wide">Český rapový vesmír. No cap.</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-12">
        <section className="relative bg-white neo-border neo-shadow p-8 lg:p-14 overflow-hidden">
          <div className="absolute top-8 right-8 w-16 h-16 bg-[#FF00FF] rounded-full neo-border pointer-events-none" />
          <div className="absolute bottom-8 right-20 w-10 h-10 bg-[#39FF14] rotate-45 neo-border pointer-events-none" />
          <div className="absolute top-1/2 right-40 w-6 h-6 bg-[#FFD800] neo-border pointer-events-none hidden lg:block" />
          <div className="flex flex-col gap-6 max-w-3xl relative z-10">
            <Badge className="bg-[#FF4A4A] text-white border-none !px-4 !py-2 text-sm w-fit">Vítej u nás</Badge>
            <h1 className="font-heading text-5xl lg:text-7xl leading-[0.9] uppercase tracking-tighter">
              Vše, co chceš<br />vědět o{" "}
              <span className="bg-[#FFD800] px-2 inline-block -ml-1">rapu</span>
            </h1>
            <p className="text-xl font-bold leading-snug text-gray-800 max-w-xl">
              Profily raperů, návody pro beatmakery a články z české i světové scény. Pure facts.
            </p>
          </div>
        </section>

        <main className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-heading text-2xl uppercase mr-2">Filtrovat:</span>
            {CATEGORIES.map((cat) => (
              <FilterButton key={cat} isActive={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
                {icons[cat]} {cat}
              </FilterButton>
            ))}
          </div>
          <div className="flex flex-col gap-6">
            {filtered.length > 0
              ? filtered.map((article) => <ArticleCard key={article.id} article={article} />)
              : <EmptyState category={activeCategory} />}
          </div>
        </main>

        <section className="grid grid-cols-3 gap-4">
          {(["Rapeři", "Návody", "Články"] as const).map((cat) => (
            <div key={cat} className="bg-black text-white neo-border neo-shadow p-4 text-center">
              <div className="font-heading text-4xl text-[#FFD800]">{counts[cat]}</div>
              <div className="font-bold text-sm uppercase tracking-widest mt-1">{cat}</div>
            </div>
          ))}
        </section>
      </div>

      <footer className="bg-black text-white text-center p-8 border-t-4 border-black mt-8">
        <p className="font-heading text-2xl uppercase tracking-wider">4RAP © 2026</p>
        <p className="font-bold mt-2 text-gray-400 text-sm">Vytvořeno pro skutečné fanoušky.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
    </Routes>
  );
}
