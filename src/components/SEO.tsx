import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

const SITE_NAME = "4RAP – Český rapový vesmír";
const DEFAULT_DESC = "Profily raperů, recenze, návody, drama. Všechno co se děje na české rap scéně.";
const BASE_URL = "https://4rap.cz";

export default function SEO({ title, description, image, url, type = "website" }: SEOProps) {
  const fullTitle = title ? `${title} | 4RAP` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const ogImage = image || "/og-default.jpg";
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("description", desc);
    setOG("og:title", fullTitle);
    setOG("og:description", desc);
    setOG("og:image", ogImage);
    setOG("og:url", canonical);
    setOG("og:type", type);
    setOG("og:site_name", SITE_NAME);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", ogImage);
  }, [fullTitle, desc, ogImage, canonical, type]);

  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOG(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}
