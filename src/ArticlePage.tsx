import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Hash, Clock, User } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ReadingProgress from "./components/ReadingProgress";
import RelatedArticles from "./components/RelatedArticles";
import SEO from "./components/SEO";

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#ff5a2e] text-white",
  Návody: "bg-[#4a90e2] text-white",
  Články: "bg-[#7c3aed] text-white",
};

export default function ArticlePage({ onRead }: { onRead?: (slug: string) => void }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);
  const article: Article | undefined = articles.find((a) => a.slug === slug);

  // Mark as read on open
  useEffect(() => {
    if (article?.slug && onRead) {
      onRead(article.slug);
    }
  }, [article?.slug, onRead]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <SEO title="404 – Nenalezeno" />
        <div className="font-heading text-5xl text-slate-300">404</div>
        <p className="font-heading text-xl uppercase text-slate-600">Článek nenalezen.</p>
        <button
          onClick={() => navigate("/")}
          className="neo-button bg-[#ff5a2e] text-white px-5 py-2.5 font-medium uppercase flex items-center gap-2 rounded-lg"
        >
          <ArrowLeft size={16} /> Zpět
        </button>
      </div>
    );
  }

  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const colorClass = CATEGORY_COLORS[article.category] || "bg-gray-200 text-black";

  return (
    <div className="min-h-screen font-sans bg-white">
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.coverImage || undefined}
        url={`/article/${article.slug}`}
        type="article"
      />
      <ReadingProgress />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5] px-3 sm:px-6 py-3 flex justify-between items-center gap-2 shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 font-heading text-lg sm:text-xl uppercase text-[#ff5a2e] hover:text-[#e63d0a] transition-colors"
        >
          <Hash size={20} className="text-[#ff5a2e]" />
          4RAP
        </button>
        <button
          onClick={() => navigate("/")}
          className="neo-button bg-slate-100 text-slate-900 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm uppercase flex items-center gap-1.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={14} /> Zpět
        </button>
      </header>

      {/* COVER IMAGE */}
      {article.coverImage && (
        <div className="w-full max-h-[280px] sm:max-h-[360px] overflow-hidden border-b border-[#e5e5e5]">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex flex-col gap-4 sm:gap-6">

        {/* ARTICLE HEADER */}
        <div className="bg-white neo-border neo-shadow p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span
              className={`inline-block px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider uppercase rounded ${colorClass}`}
            >
              {article.category}
            </span>
            <span className="font-medium text-slate-500 text-[10px] sm:text-xs">{formattedDate}</span>
            <span className="flex items-center gap-1 font-medium text-slate-400 text-[10px] sm:text-xs">
              <User size={11} /> {article.author}
            </span>
            {article.readingTime > 0 && (
              <span className="flex items-center gap-1 font-medium text-slate-400 text-[10px] sm:text-xs">
                <Clock size={11} /> {article.readingTime} min
              </span>
            )}
          </div>

          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl uppercase leading-tight text-slate-900">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed border-l-3 border-[#ff5a2e] pl-3 sm:pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                  className="text-[10px] sm:text-xs font-medium uppercase px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-[#ff5a2e] hover:text-white transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Artists */}
          {article.artists.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.artists.map((artist) => (
                <button
                  key={artist}
                  onClick={() =>
                    navigate(`/artist/${artist.toLowerCase().replace(/\s+/g, "-")}`)
                  }
                  className="text-[10px] sm:text-xs font-medium uppercase px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-[#ff5a2e] hover:text-white hover:border-[#ff5a2e] transition-colors"
                >
                  {artist}
                </button>
              ))}
            </div>
          )}

          {/* Meta info row */}
          {(article.genre || article.city || article.era) && (
            <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium text-slate-400 uppercase pt-1">
              {article.genre && <span>Genre: {article.genre}</span>}
              {article.city && <span>{article.city}</span>}
              {article.era && <span>Era: {article.era}</span>}
            </div>
          )}
        </div>

        {/* ARTICLE BODY */}
        <div className="bg-white neo-border neo-shadow p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl">
          <div className="prose-4rap">
            <ReactMarkdown>{article.rawContent}</ReactMarkdown>
          </div>
        </div>

        {/* RELATED */}
        <RelatedArticles currentSlug={article.slug} />
      </div>
    </div>
  );
}
