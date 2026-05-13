import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Hash, Clock, User } from "lucide-react";
import { loadArticles, type Article } from "./articles";
import ReadingProgress from "./components/ReadingProgress";
import RelatedArticles from "./components/RelatedArticles";
import SEO from "./components/SEO";

const CATEGORY_COLORS: Record<string, string> = {
  Rapeři: "bg-accent text-paper",
  Návody: "bg-blue-600 text-white",
  Články: "bg-violet-600 text-white",
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-paper">
        <SEO title="404 – Nenalezeno" />
        <div className="font-heading text-5xl text-muted-soft">404</div>
        <p className="font-heading text-xl uppercase text-muted">Článek nenalezen.</p>
        <button
          onClick={() => navigate("/")}
          className="neo-button bg-accent text-paper px-5 py-2.5 font-medium uppercase flex items-center gap-2 rounded-lg"
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
  const colorClass = CATEGORY_COLORS[article.category] || "bg-secondary text-ink";

  return (
    <div className="min-h-screen font-sans bg-paper transition-colors duration-200">
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.coverImage || undefined}
        url={`/article/${article.slug}`}
        type="article"
      />
      <ReadingProgress />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border px-3 sm:px-5 py-2.5 flex justify-between items-center gap-2 bg-card/95 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 font-heading text-lg sm:text-xl uppercase text-accent hover:opacity-80 transition-opacity"
        >
          <Hash size={18} className="sm:w-5 sm:h-5" />
          4RAP
        </button>
        <button
          onClick={() => navigate("/")}
          className="neo-button bg-secondary text-ink px-3 py-1.5 font-medium text-xs uppercase flex items-center gap-1.5 rounded-lg hover:bg-border transition-colors"
        >
          <ArrowLeft size={14} /> Zpět
        </button>
      </header>

      {/* COVER IMAGE */}
      {article.coverImage && (
        <div className="w-full max-h-[240px] sm:max-h-[320px] overflow-hidden border-b border-border">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex flex-col gap-4 sm:gap-5">

        {/* ARTICLE HEADER */}
        <div className="bg-card neo-border neo-shadow p-4 sm:p-6 flex flex-col gap-3 rounded-lg sm:rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase rounded ${colorClass}`}>
              {article.category}
            </span>
            <span className="font-medium text-muted text-[10px] sm:text-xs">{formattedDate}</span>
            <span className="flex items-center gap-1 font-medium text-muted-soft text-[10px] sm:text-xs">
              <User size={10} /> {article.author}
            </span>
            {article.readingTime > 0 && (
              <span className="flex items-center gap-1 font-medium text-muted-soft text-[10px] sm:text-xs">
                <Clock size={10} /> {article.readingTime} min
              </span>
            )}
          </div>

          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl uppercase leading-tight text-ink">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-sm sm:text-base font-medium text-muted leading-relaxed border-l-2 border-accent pl-3">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {article.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                  className="text-[10px] sm:text-xs font-medium uppercase px-2 py-0.5 bg-secondary text-muted rounded hover:bg-accent hover:text-paper transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Artists */}
          {article.artists.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.artists.map((artist) => (
                <button
                  key={artist}
                  onClick={() =>
                    navigate(`/artist/${artist.toLowerCase().replace(/\s+/g, "-")}`)
                  }
                  className="text-[10px] sm:text-xs font-medium uppercase px-2 py-0.5 bg-card border border-border text-muted rounded hover:bg-accent hover:text-paper hover:border-accent transition-colors"
                >
                  {artist}
                </button>
              ))}
            </div>
          )}

          {/* Meta info row */}
          {(article.genre || article.city || article.era) && (
            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-medium text-muted-soft uppercase pt-1">
              {article.genre && <span>Genre: {article.genre}</span>}
              {article.city && <span>{article.city}</span>}
              {article.era && <span>Era: {article.era}</span>}
            </div>
          )}
        </div>

        {/* ARTICLE BODY */}
        <div className="bg-card neo-border neo-shadow p-4 sm:p-6 rounded-lg sm:rounded-xl">
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
