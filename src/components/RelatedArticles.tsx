import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getRelatedSlugs } from "../lib/relations";
import { loadArticles, type Article } from "../articles";

interface Props {
  currentSlug: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Rapeři": "bg-accent text-paper",
  "Návody": "bg-blue-600 text-white",
  "Články": "bg-violet-600 text-white",
};

export default function RelatedArticles({ currentSlug }: Props) {
  const [related, setRelated] = useState<Article[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const slugs = await getRelatedSlugs(currentSlug);
      if (cancelled) return;
      const all = loadArticles();
      const found = slugs
        .map((s) => all.find((a) => a.slug === s))
        .filter((a): a is Article => !!a)
        .slice(0, 3);
      setRelated(found);
    })();
    return () => { cancelled = true; };
  }, [currentSlug]);

  if (!related.length) return null;

  return (
    <section className="mt-4 sm:mt-5">
      <h2 className="font-heading text-sm sm:text-base uppercase mb-3 border-b-2 border-accent pb-2 text-ink">
        Čti taky
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((article) => {
          const colorClass = CATEGORY_COLORS[article.category] || "bg-secondary text-ink";
          return (
            <article
              key={article.slug}
              onClick={() => navigate(`/article/${article.slug}`)}
              className="bg-card neo-border neo-shadow p-3 flex flex-col gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-lg"
            >
              <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded uppercase ${colorClass}`}>
                {article.category}
              </span>
              <h3 className="font-heading text-sm uppercase leading-tight text-ink">
                {article.title}
              </h3>
              <p className="text-xs font-medium text-muted leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase mt-auto text-accent hover:text-accent-hover">
                Číst <ArrowRight size={11} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
