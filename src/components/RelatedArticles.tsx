import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getRelatedSlugs } from "../lib/relations";
import { loadArticles, type Article } from "../articles";

interface Props {
  currentSlug: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Rapeři": "bg-[#ff5a2e] text-white",
  "Návody": "bg-[#4a90e2] text-white",
  "Články": "bg-[#7c3aed] text-white",
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
    <section className="mt-4 sm:mt-6">
      <h2 className="font-heading text-base sm:text-lg uppercase mb-3 sm:mb-4 border-b-2 border-[#ff5a2e] pb-2 text-slate-900">
        Čti taky
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((article) => {
          const colorClass = CATEGORY_COLORS[article.category] || "bg-slate-200 text-slate-900";
          return (
            <article
              key={article.slug}
              onClick={() => navigate(`/article/${article.slug}`)}
              className="bg-white neo-border neo-shadow p-3 sm:p-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-lg"
            >
              <span className={`self-start text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded uppercase ${colorClass}`}>
                {article.category}
              </span>
              <h3 className="font-heading text-sm sm:text-base uppercase leading-tight text-slate-900">
                {article.title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium uppercase mt-auto text-[#ff5a2e] hover:text-[#e63d0a]">
                Číst <ArrowRight size={12} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
