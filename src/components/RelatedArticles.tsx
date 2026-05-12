import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getRelatedSlugs } from "../lib/relations";
import { loadArticles, type Article } from "../articles";

interface Props {
  currentSlug: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Rapeři": "bg-[#FF4A4A] text-white",
  "Návody": "bg-[#39FF14] text-black",
  "Články": "bg-[#00BFFF] text-black",
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
    <section className="mt-12">
      <h2 className="font-heading text-2xl uppercase mb-6 border-b-4 border-black pb-3">
        Čti taky
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((article) => {
          const colorClass = CATEGORY_COLORS[article.category] || "bg-gray-200 text-black";
          return (
            <article
              key={article.slug}
              onClick={() => navigate(`/article/${article.slug}`)}
              className="bg-white neo-border neo-shadow p-5 flex flex-col gap-3 cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-100"
            >
              <span className={`self-start text-xs font-bold px-2 py-0.5 neo-border uppercase ${colorClass}`}>
                {article.category}
              </span>
              <h3 className="font-heading text-base uppercase leading-tight">
                {article.title}
              </h3>
              <p className="text-sm font-medium text-gray-600 leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <span className="flex items-center gap-1 text-xs font-bold uppercase mt-auto text-black/60 hover:text-black">
                Číst <ArrowRight size={12} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
