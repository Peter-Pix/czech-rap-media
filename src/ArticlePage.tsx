import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, Hash, Tag } from "lucide-react";
import { loadArticles, type Article } from "./articles";

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);

  const index = articles.findIndex((a) => a.slug === slug);
  const article: Article | undefined = articles[index];
  const prev = index > 0 ? articles[index - 1] : null;
  const next = index < articles.length - 1 ? articles[index + 1] : null;

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <div className="font-heading text-6xl">404</div>
        <p className="font-heading text-2xl uppercase">Článek nenalezen.</p>
        <button onClick={() => navigate("/")} className="neo-button bg-black text-white px-6 py-3 font-heading uppercase flex items-center gap-2">
          <ArrowLeft size={18} /> Zpět na hlavní
        </button>
      </div>
    );
  }

  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const colorClass = CATEGORY_COLORS[article.category] || "bg-gray-200 text-black";

  return (
    <div className="min-h-screen font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black px-6 py-4 flex justify-between items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-heading text-xl uppercase text-[#39FF14] hover:text-white transition-colors"
        >
          <Hash size={24} className="text-[#39FF14]" />
          4RAP
        </button>
        <button
          onClick={() => navigate("/")}
          className="neo-button bg-white text-black px-4 py-2 font-heading text-sm uppercase flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Zpět
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-10">

        {/* ARTICLE HEADER */}
        <div className="bg-white neo-border neo-shadow p-8 lg:p-12 flex flex-col gap-5">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`inline-block px-3 py-1 text-sm font-bold tracking-wider uppercase neo-border ${colorClass}`}>
              {article.category}
            </span>
            <span className="font-bold text-gray-500 text-sm">{formattedDate}</span>
            <span className="font-bold text-gray-400 text-sm">— {article.author}</span>
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl tracking-tight uppercase leading-tight">
            {article.title}
          </h1>
          <p className="text-xl font-bold text-gray-600 leading-snug border-l-4 border-[#FFD800] pl-4">
            {article.excerpt}
          </p>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              <Tag size={14} className="text-gray-400" />
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ARTICLE BODY */}
        <div className="bg-white neo-border neo-shadow p-8 lg:p-12">
          <div className="prose-4rap">
            <ReactMarkdown>{article.rawContent}</ReactMarkdown>
          </div>
        </div>

        {/* PREV / NEXT NAVIGATION */}
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prev ? (
            <button
              onClick={() => navigate(`/article/${prev.slug}`)}
              className="neo-button bg-white text-black p-5 text-left flex flex-col gap-1 group"
            >
              <span className="font-bold text-xs uppercase text-gray-400 flex items-center gap-1">
                <ArrowLeft size={14} /> Novější článek
              </span>
              <span className="font-heading text-base uppercase leading-tight group-hover:underline">
                {prev.title}
              </span>
            </button>
          ) : <div />}
          {next ? (
            <button
              onClick={() => navigate(`/article/${next.slug}`)}
              className="neo-button bg-black text-white p-5 text-right flex flex-col gap-1 sm:items-end group"
            >
              <span className="font-bold text-xs uppercase text-[#FFD800] flex items-center gap-1">
                Starší článek <ArrowRight size={14} />
              </span>
              <span className="font-heading text-base uppercase leading-tight group-hover:underline">
                {next.title}
              </span>
            </button>
          ) : <div />}
        </nav>

        {/* BACK TO HOME */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="neo-button bg-black text-white px-8 py-4 font-heading text-lg uppercase flex items-center gap-3"
          >
            <ArrowLeft size={20} /> Všechny články
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-black text-white text-center p-8 border-t-4 border-black mt-8">
        <p className="font-heading text-2xl uppercase tracking-wider">4RAP © 2026</p>
        <p className="font-bold mt-2 text-gray-400 text-sm">Vytvořeno pro skutečné fanoušky.</p>
      </footer>
    </div>
  );
}
