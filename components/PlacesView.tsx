"use client";

import { useState, useMemo, type ReactNode } from "react";

const dummyPlaces = [
  { id: 1, name: "Borough Market", city: "London", area: "Southwark, London", type: "restaurant", description: "London's oldest food market packed with the finest artisan food and drink from around the world.", rating: 4.7, reviews: 12453, tag: "Must Visit", gradient: "from-orange-900 via-orange-800 to-amber-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 2, name: "The British Museum", city: "London", area: "Bloomsbury, London", type: "museum", description: "World's greatest collection of art and antiquities spanning two million years of human history.", rating: 4.8, reviews: 89234, tag: "Iconic", gradient: "from-violet-900 via-purple-800 to-purple-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 3, name: "Dishoom Covent Garden", city: "London", area: "Covent Garden, London", type: "restaurant", description: "Bombay-style café serving legendary black daal, bacon naan rolls and house-brewed chai.", rating: 4.8, reviews: 34562, tag: "Top Restaurant", gradient: "from-red-900 via-rose-800 to-pink-700", mapsUrl: "https://maps.google.com", openNow: false },
  { id: 4, name: "Monmouth Coffee", city: "London", area: "Borough Market, London", type: "cafe", description: "Award-winning specialty coffee roasters. One of the best coffee experiences in the city.", rating: 4.6, reviews: 8921, tag: "Coffee Lover", gradient: "from-amber-900 via-amber-800 to-yellow-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 5, name: "Tower Bridge", city: "London", area: "Tower Hill, London", type: "attraction", description: "Victorian Gothic masterpiece — one of London's most iconic landmarks with a stunning glass walkway.", rating: 4.6, reviews: 54782, tag: "Landmark", gradient: "from-blue-900 via-blue-800 to-indigo-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 6, name: "Harrods", city: "London", area: "Knightsbridge, London", type: "shop", description: "The world-famous luxury department store spanning 330 departments across seven floors.", rating: 4.5, reviews: 41230, tag: "Luxury Shopping", gradient: "from-emerald-900 via-teal-800 to-teal-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 7, name: "National Gallery", city: "London", area: "Trafalgar Square, London", type: "museum", description: "Over 2,300 paintings from the 13th to 19th century — Van Gogh, Da Vinci, Monet. Free entry.", rating: 4.7, reviews: 67891, tag: "Free Entry", gradient: "from-slate-900 via-slate-800 to-slate-700", mapsUrl: "https://maps.google.com", openNow: false },
  { id: 8, name: "Sketch London", city: "London", area: "Mayfair, London", type: "cafe", description: "Iconic Mayfair destination. The Pink Room is one of the most Instagrammed cafes in the world.", rating: 4.4, reviews: 15643, tag: "Instagrammable", gradient: "from-pink-900 via-pink-800 to-rose-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 9, name: "Edinburgh Castle", city: "Edinburgh", area: "Castle Hill, Edinburgh", type: "attraction", description: "Dominating the skyline from volcanic rock — this fortress holds Scotland's crown jewels.", rating: 4.7, reviews: 38920, tag: "Historic", gradient: "from-stone-900 via-stone-800 to-stone-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 10, name: "The Fat Duck", city: "Bray", area: "Bray, Berkshire", type: "restaurant", description: "Heston Blumenthal's legendary 3 Michelin-star restaurant. The ultimate multi-sensory dining journey.", rating: 4.9, reviews: 3241, tag: "Michelin ★★★", gradient: "from-indigo-900 via-indigo-800 to-blue-700", mapsUrl: "https://maps.google.com", openNow: false },
  { id: 11, name: "Victoria Quarter", city: "Leeds", area: "Leeds City Centre", type: "shop", description: "Stunning Victorian arcades under magnificent stained glass, home to luxury boutiques.", rating: 4.4, reviews: 6732, tag: "Boutique", gradient: "from-cyan-900 via-cyan-800 to-sky-700", mapsUrl: "https://maps.google.com", openNow: true },
  { id: 12, name: "Bettys Café Tea Rooms", city: "York", area: "St. Helen's Square, York", type: "cafe", description: "A Yorkshire institution since 1919. Famous for Fat Rascals, hand-made chocolates and Swiss patisserie.", rating: 4.6, reviews: 19823, tag: "Yorkshire Icon", gradient: "from-rose-900 via-rose-800 to-pink-700", mapsUrl: "https://maps.google.com", openNow: true },
];

const CATEGORIES = ["All", "Restaurant", "Museum", "Cafe", "Attraction", "Shop"];
const SORT_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "rating",     label: "Top Rated" },
  { value: "name",       label: "Name A–Z" },
  { value: "reviews",    label: "Most Reviewed" },
];

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: ReactNode }> = {
  restaurant: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v3.41a3 3 0 01-1.5 2.598V18.75h15v-2.134a3 3 0 01-1.5-2.598v-3.41" /></svg> },
  museum:     { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg> },
  cafe:       { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 1.265l.39 3.905A2.25 2.25 0 0118.393 22.5H5.607a2.25 2.25 0 01-2.247-2.326l.39-3.905A2.25 2.25 0 015.2 15M19.8 15H4.2" /></svg> },
  attraction: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
  shop:       { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-100",icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg> },
};

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < full ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className={`w-3 h-3 ${i < full ? "text-amber-400" : "text-slate-200"}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

type SortValue = "default" | "rating" | "name" | "reviews";

export default function PlacesView() {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [sortBy, setSortBy]       = useState<SortValue>("default");
  const [sortOpen, setSortOpen]   = useState(false);
  const [openOnly, setOpenOnly]   = useState(false);

  const results = useMemo(() => {
    let list = dummyPlaces.filter((p) => {
      const okCat  = category === "All" || p.type.toLowerCase() === category.toLowerCase();
      const q      = search.toLowerCase();
      const okSrch = !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const okOpen = !openOnly || p.openNow;
      return okCat && okSrch && okOpen;
    });
    if (sortBy === "rating")  list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "name")    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "reviews") list = [...list].sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [search, category, sortBy, openOnly]);

  const featured     = useMemo(() => dummyPlaces.filter((p) => p.rating >= 4.7).slice(0, 5), []);
  const showFeatured = category === "All" && !search && !openOnly;
  const activeSort   = SORT_OPTIONS.find((o) => o.value === sortBy)!;
  const hasFilters   = category !== "All" || search || sortBy !== "default" || openOnly;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Search ──────────────────────────────────────── */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search places, restaurants, museums…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Categories + Open Now toggle ────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                category === cat ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-slate-100 text-slate-500"
              }`}
            >{cat}</button>
          ))}
          {/* Open Now pill */}
          <button type="button" onClick={() => setOpenOnly((v) => !v)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              openOnly ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${openOnly ? "bg-white" : "bg-emerald-500"}`} />
            Open Now
          </button>
        </div>
      </div>

      {/* ── Sort Panel ──────────────────────────────────── */}
      {sortOpen && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Sort by</p>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => { setSortBy(opt.value as SortValue); setSortOpen(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  sortBy === opt.value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Featured ────────────────────────────────────── */}
      {showFeatured && (
        <section className="pt-5 pb-1">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Top Picks</p>
              <h2 className="text-base font-bold text-slate-900">Must-See Places</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
            {featured.map((p) => (
              <div key={p.id} className={`flex-shrink-0 w-52 h-48 rounded-3xl bg-gradient-to-br ${p.gradient} p-4 relative overflow-hidden active:scale-95 transition-transform shadow-lg`}>
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -right-4 w-36 h-36 bg-white/5 rounded-full" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="inline-block bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{p.tag}</span>
                      {p.openNow && <span className="flex items-center gap-1 bg-emerald-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg"><span className="w-1.5 h-1.5 bg-white rounded-full" />Open</span>}
                    </div>
                    <h3 className="text-white font-bold text-sm leading-snug">{p.name}</h3>
                    <p className="text-white/65 text-xs mt-0.5 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      {p.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-2.5 py-1.5">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-400"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                      <span className="text-white text-xs font-bold">{p.rating}</span>
                      <span className="text-white/60 text-[10px]">({(p.reviews / 1000).toFixed(0)}k)</span>
                    </div>
                    <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                      Map
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── List ────────────────────────────────────────── */}
      <section className="px-4 pt-4 pb-28">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Results</p>
            <h2 className="text-sm font-bold text-slate-900">
              {results.length} Place{results.length !== 1 ? "s" : ""}
              {hasFilters && <span className="text-violet-500 ml-1 text-xs font-normal">(filtered)</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); setOpenOnly(false); }} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-xl active:scale-95">Clear</button>
            )}
            <button type="button" onClick={() => setSortOpen((v) => !v)}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold active:scale-95 shadow-sm ${
                sortBy !== "default" ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
              {sortBy !== "default" ? activeSort.label : "Sort"}
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <p className="font-bold text-slate-700 mb-1">No places found</p>
            <p className="text-slate-400 text-sm text-center">Try different search or filters</p>
            <button type="button" onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); setOpenOnly(false); }} className="mt-4 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95">Reset all</button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((p) => {
              const cfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.attraction;
              return (
                <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 active:scale-[0.99] transition-transform">
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl ${cfg.bg} ${cfg.text} flex items-center justify-center border ${cfg.border}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1">{p.name}</h3>
                        {p.openNow
                          ? <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Open</span>
                          : <span className="flex-shrink-0 text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">Closed</span>
                        }
                      </div>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mb-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-violet-500 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        {p.area}
                      </p>
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 mb-2">{p.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Stars rating={p.rating} />
                          <span className="text-[10px] font-bold text-slate-700">{p.rating}</span>
                          <span className="text-slate-300 text-[10px]">
                            ({p.reviews >= 1000 ? `${(p.reviews / 1000).toFixed(0)}k` : p.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{p.type}</span>
                          <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl active:scale-95 shadow-sm shadow-violet-200">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                            Map
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
