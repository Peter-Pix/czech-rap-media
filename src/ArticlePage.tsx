import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Hash, Clock, User } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ReadingProgress from "./components/ReadingProgress";
import RelatedArticles from "./components/RelatedArticles";
import SEO from "./components/SEO";

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-[#FF4A4A] text-white",
  Návody: "bg-[#39FF14] text-black",
  Články: "bg-[#00BFFF] text-black",
};

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const articles = useMemo(() => loadArticles(), []);
  const article: Article | undefined = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <SEO title="404 – Nenalezeno" />
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
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.coverImage || undefined}
        url={`/article/${article.slug}`}
        type="article"
      />
      <ReadingProgress />

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

      {/* COVER IMAGE */}
      {article.coverImage && (
        <div className="w-full max-h-[400px] overflow-hidden border-b-4 border-black">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-10">

        {/* ARTICLE HEADER */}
        <div className="bg-white neo-border neo-shadow p-8 lg:p-12 flex flex-col gap-5">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`inline-block px-3 py-1 text-sm font-bold tracking-wider uppercase neo-border ${colorClass}`}>
              {article.category}
            </span>
            <span className="font-bold text-gray-500 text-sm">{formattedDate}</span>
            <span className="flex items-center gap-1 font-bold text-gray-400 text-sm">
              <User size={13} /> {article.author}
            </span>
            {article.readingTime > 0 && (
              <span className="flex items-center gap-1 font-bold text-gray-400 text-sm">
                <Clock size={13} /> {article.readingTime} min čtení
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl lg:text-4xl uppercase leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg font-medium text-gray-600 leading-relaxed border-l-4 border-black pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {article.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                  className="text-xs font-bold uppercase px-2 py-0.5 bg-[#FFD800] neo-border hover:bg-black hover:text-[#FFD800] transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Artists */}
          {article.artists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.artists.map((artist) => (
                <button
                  key={artist}
                  onClick={() => navigate(`/artist/${artist.toLowerCase().replace(/\s+/g, "-")}`)}
                  className="text-xs font-bold uppercase px-2 py-0.5 bg-white neo-border hover:bg-[#FF4A4A] hover:text-white transition-colors"
                >
                  🎤 {artist}
                </button>
              ))}
            </div>
          )}

          {/* Meta info row */}
          {(article.genre || article.city || article.era) && (
            <div className="flex flex-wrap gap-3 text-xs font-bold text-black/40 uppercase pt-1">
              {article.genre && <span>Genre: {article.genre}</span>}
              {article.city && <span>📍 {article.city}</span>}
              {article.era && <span>Era: {article.era}</span>}
            </div>
          )}
        </div>

        {/* ARTICLE BODY */}
        <div className="bg-white neo-border neo-shadow p-8 lg:p-12">
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
