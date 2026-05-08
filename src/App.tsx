import React, { useState } from 'react';
import { Sparkles, Copy, CheckCircle2, Target, Check, Lightbulb, UserCheck, Megaphone, Terminal } from 'lucide-react';

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-block px-3 py-1 text-sm font-bold tracking-wider uppercase neo-border ${className}`}>
    {children}
  </span>
);

const BrutalistButton = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`neo-button px-6 py-3 font-heading text-lg lg:text-xl uppercase flex items-center justify-center gap-2 ${className}`}
  >
    {children}
  </button>
);

const ArticleCard = ({ category, date, title, description }: { category: string, date: string, title: string, description: string }) => (
  <div className="bg-white neo-border neo-shadow p-6 lg:p-8 flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <Badge className="bg-black text-white">{category}</Badge>
      <span className="font-bold text-gray-500">{date}</span>
    </div>
    <h2 className="font-heading text-2xl lg:text-4xl tracking-wide uppercase">{title}</h2>
    <p className="font-sans font-medium text-lg lg:text-xl text-gray-800 leading-relaxed max-w-4xl">
      {description}
    </p>
  </div>
);

export default function App() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 lg:px-16 font-sans flex flex-col gap-16 lg:gap-24 max-w-7xl mx-auto overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative bg-white neo-border neo-shadow p-8 lg:p-16">
        <div className="absolute top-6 right-6 lg:top-12 lg:right-12 w-12 h-12 lg:w-20 lg:h-20 bg-[#39FF14] rounded-full neo-border" />
        
        <div className="flex flex-col items-start gap-6 lg:gap-8 max-w-4xl relative z-10">
          <Badge className="bg-[#FF4A4A] text-white border-none !px-4 !py-2 text-base">NOVINKA 2025</Badge>
          
          <h1 className="font-heading text-6xl lg:text-[7rem] leading-[0.9] uppercase tracking-tighter">
            Tvůj rapový<br/>
            <span className="bg-[#FFD800] px-2 inline-block -ml-2 mb-2">vesmír</span>
          </h1>
          
          <p className="text-xl lg:text-2xl font-bold max-w-2xl leading-snug">
            Generuj bio raperů, tutoriály pro beatmakery a deep-dive články pomocí AI. No cap. Pure facts.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <BrutalistButton className="bg-[#FF00FF] text-white">
              Začít generovat
            </BrutalistButton>
            <BrutalistButton className="bg-white">
              Prohlížet články
            </BrutalistButton>
          </div>
        </div>
      </section>

      {/* ARTICLES SECTION */}
      <section className="flex flex-col gap-8">
        <ArticleCard 
          category="Rapeři" 
          date="8. 5. 2026" 
          title="Yzomandias: Od DJ k rapové legendě" 
          description="Příběh Jakuba Vlčka, známého jako Yzomandias, od jeho začátků jako DJ po status předního českého rappera." 
        />
        <ArticleCard 
          category="Rapeři" 
          date="8. 5. 2026" 
          title="Smack: Průkopník české grime scény" 
          description="Jakub Janeček, známý jako Smack, je průkopníkem české grime scény a zakladatelem labelu Archetyp 51." 
        />
        <ArticleCard 
          category="Články" 
          date="8. 5. 2026" 
          title="Rychlá historie rapu: Od bronxských ulic po české beaty" 
          description="Rap se z bronxských ulic dostal až na českou scénu, kde ovlivnil hudbu a kulturu." 
        />
      </section>

      {/* AI GENERATOR SECTION */}
      <section className="flex flex-col gap-6">
        {/* Progress Steps */}
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-[#39FF14] flex items-center gap-2"><Lightbulb size={16} /> Nápad</Badge>
          <Badge className="bg-[#39FF14] flex items-center gap-2"><UserCheck size={16} /> Výběr</Badge>
          <Badge className="bg-[#39FF14] flex items-center gap-2"><Megaphone size={16} /> Marketing</Badge>
          <Badge className="bg-black text-white flex items-center gap-2 !border-black relative">
             <Terminal size={16} /> Prompt
             {/* Simple visual trick for active step pseudo border */}
             <div className="absolute -bottom-2 -right-2 w-full h-full border-b-4 border-r-4 border-[#FFD800] -z-10" />
          </Badge>
        </div>

        {/* Title */}
        <div className="mt-4">
          <h2 className="inline-block bg-black text-white font-heading text-3xl lg:text-5xl uppercase px-4 py-3 pb-2 transform -skew-x-[4deg]">
            AI Nápad Generátor
          </h2>
          <p className="font-bold text-lg lg:text-xl mt-4 flex items-center gap-2 flex-wrap">
            Vytvoř milionový AI nástroj ve 3 krocích <ArrowRight size={20} /> Nápad <ArrowRight size={20} /> Marketing <ArrowRight size={20} /> Kód
          </p>
        </div>

        {/* Success Banner */}
        <div className="bg-[#39FF14] neo-border neo-shadow p-6 flex items-center gap-4 mt-4">
          <CheckCircle2 size={48} strokeWidth={2} />
          <div>
            <h3 className="font-heading text-3xl uppercase">Hotovo!</h3>
            <p className="font-bold text-lg">Tvůj perfektní prompt pro base44 AI kodéra</p>
          </div>
        </div>

        {/* Generated Output Area */}
        <div className="bg-white neo-border neo-shadow p-6 lg:p-10 flex flex-col gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-heading text-2xl lg:text-3xl uppercase">Zkopíruj a vlož do base44</h3>
            <BrutalistButton onClick={handleCopy} className="bg-[#FFD800] text-black !py-2 !px-4 !text-base lg:!text-lg">
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? "Zkopírováno" : "Kopírovat"}
            </BrutalistButton>
          </div>

          <div className="neo-border p-6 bg-gray-50 text-base lg:text-lg font-bold leading-relaxed whitespace-pre-wrap font-sans">
            Vyvořte aplikaci s názvem "AI Rap History Creator", která automaticky generuje deep-dive články na základě textového popisu rapera. Aplikace musí mít uživatelsky přívětivé rozhraní, které bude intuitivní i pro začátečníky. Hlavní obrazovka by měla obsahovat vstupní pole pro uživatele, kde mohou vložit stručný přehled jména. Po odeslání by aplikace měla analyzovat text a vytvořit komplexní článek s různými zdroji a fakty. UI by mělo zahrnovat možnost úpravy textu. Aplikace by měla mít databázovou strukturu...
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <BrutalistButton className="bg-[#FF00FF] text-white flex-1" onClick={handleCopy}>
               <Copy size={24} /> {copied ? "Zkopírováno!" : "Kopírovat prompt"}
            </BrutalistButton>
            <BrutalistButton className="bg-[#58A6FF] text-white flex-1">
               <Sparkles size={24} /> Nový nápad
            </BrutalistButton>
          </div>
        </div>

        {/* Footer Instructions */}
        <div className="bg-[#FFD800] neo-border neo-shadow p-8 lg:p-12 mt-8">
          <h3 className="font-heading text-2xl lg:text-3xl uppercase flex items-center gap-3 mb-8">
            <Target size={32} className="text-red-600" /> Co teď?
          </h3>
          
          <ul className="flex flex-col gap-6 font-bold text-lg lg:text-xl">
            {[
              "Zkopíruj prompt výše",
              "Otevři base44.com",
              "Vytvoř novou aplikaci",
              "Vlož prompt do AI kodéra",
              "Sleduj, jak se tvůj nástroj tvoří!"
            ].map((step, idx) => (
              <li key={idx} className="flex items-center gap-4">
                <span className="bg-black text-white px-3 py-1 neo-border flex-shrink-0">{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

      </section>
      
    </div>
  );
}
