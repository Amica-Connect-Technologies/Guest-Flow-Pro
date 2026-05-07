"use client";

import { useState, useMemo } from "react";

const dummyTours = [
  { id: 1, title: "Tower of London & Crown Jewels", city: "London", area: "Tower Hill, London", category: "Historical", duration: "3 hrs", durationMin: 180, groupSize: "Up to 25", rating: 4.8, reviews: 3241, price: 35, gradient: "from-amber-900 via-amber-800 to-orange-700", tag: "Best Seller", included: ["Guide", "Entry", "Audio"], provider: "GetYourGuide" },
  { id: 2, title: "Harry Potter Studios Full Experience", city: "London", area: "Leavesden, Hertfordshire", category: "Entertainment", duration: "4 hrs", durationMin: 240, groupSize: "Up to 30", rating: 4.9, reviews: 5812, price: 55, gradient: "from-purple-900 via-violet-800 to-purple-700", tag: "Fan Favorite", included: ["Transport", "Entry", "Guide"], provider: "Viator" },
  { id: 3, title: "Scottish Highlands Day Trip", city: "Edinburgh", area: "Loch Ness & Glencoe", category: "Nature", duration: "Full day", durationMin: 480, groupSize: "Up to 16", rating: 4.7, reviews: 1876, price: 79, gradient: "from-emerald-900 via-teal-800 to-teal-700", tag: "Top Rated", included: ["Guide", "Lunch", "Transport"], provider: "GetYourGuide" },
  { id: 4, title: "London by Night Open-Top Bus", city: "London", area: "Westminster, London", category: "Sightseeing", duration: "2 hrs", durationMin: 120, groupSize: "Up to 50", rating: 4.6, reviews: 2104, price: 25, gradient: "from-indigo-900 via-blue-800 to-blue-700", tag: "Popular", included: ["Commentary", "Hop-On"], provider: "Viator" },
  { id: 5, title: "Stonehenge & Bath Day Tour", city: "Bath", area: "Wiltshire & Somerset", category: "Historical", duration: "Full day", durationMin: 480, groupSize: "Up to 20", rating: 4.8, reviews: 4231, price: 65, gradient: "from-stone-800 via-stone-700 to-amber-700", tag: "Iconic", included: ["Entry", "Guide", "Transport"], provider: "GetYourGuide" },
  { id: 6, title: "Oxford & Cotswolds Villages Tour", city: "Oxford", area: "Oxford & The Cotswolds", category: "Cultural", duration: "Full day", durationMin: 480, groupSize: "Up to 25", rating: 4.7, reviews: 1543, price: 59, gradient: "from-blue-900 via-cyan-800 to-sky-700", tag: "Cultural Pick", included: ["Guide", "Transport"], provider: "Viator" },
  { id: 7, title: "Jack the Ripper Walking Tour", city: "London", area: "Whitechapel, East London", category: "Historical", duration: "2 hrs", durationMin: 120, groupSize: "Up to 35", rating: 4.5, reviews: 6782, price: 15, gradient: "from-slate-900 via-slate-800 to-slate-700", tag: "After Dark", included: ["Expert Guide", "Stories"], provider: "GetYourGuide" },
  { id: 8, title: "Lake District Scenic Walking Tour", city: "Lake District", area: "Windermere & Grasmere", category: "Nature", duration: "Full day", durationMin: 480, groupSize: "Up to 12", rating: 4.9, reviews: 892, price: 89, gradient: "from-teal-900 via-teal-800 to-emerald-700", tag: "Adventure", included: ["Expert Guide", "Snacks", "Map"], provider: "Viator" },
];

const CATEGORIES = ["All", "Historical", "Nature", "Sightseeing", "Cultural", "Entertainment"];
const SORT_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "price_asc",  label: "Price ↑ Low" },
  { value: "price_desc", label: "Price ↓ High" },
  { value: "rating",     label: "Top Rated" },
  { value: "duration",   label: "Shortest First" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Historical:   "bg-amber-50 text-amber-700 border-amber-100",
  Nature:       "bg-emerald-50 text-emerald-700 border-emerald-100",
  Sightseeing:  "bg-blue-50 text-blue-700 border-blue-100",
  Cultural:     "bg-cyan-50 text-cyan-700 border-cyan-100",
  Entertainment:"bg-purple-50 text-purple-700 border-purple-100",
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

type SortValue = "default" | "price_asc" | "price_desc" | "rating" | "duration";

export default function ToursView() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy]     = useState<SortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);

  const results = useMemo(() => {
    let list = dummyTours.filter((t) => {
      const okCat  = category === "All" || t.category === category;
      const q      = search.toLowerCase();
      const okSrch = !q || t.title.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return okCat && okSrch;
    });
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "rating")     list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "duration")   list = [...list].sort((a, b) => a.durationMin - b.durationMin);
    return list;
  }, [search, category, sortBy]);

  const featured   = useMemo(() => dummyTours.filter((t) => t.rating >= 4.8).slice(0, 5), []);
  const showFeatured = category === "All" && !search;
  const activeSort = SORT_OPTIONS.find((o) => o.value === sortBy)!;
  const hasFilters = category !== "All" || search || sortBy !== "default";

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
            placeholder="Search tours, cities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Categories ──────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                category === cat ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-500"
              }`}
            >{cat}</button>
          ))}
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
                  sortBy === opt.value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Highest Rated</p>
              <h2 className="text-base font-bold text-slate-900">Featured Tours</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
            {featured.map((t) => (
              <div key={t.id} className={`flex-shrink-0 w-60 h-48 rounded-3xl bg-gradient-to-br ${t.gradient} p-4 relative overflow-hidden active:scale-95 transition-transform shadow-lg`}>
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -right-4 w-36 h-36 bg-white/5 rounded-full" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{t.tag}</span>
                      <span className="bg-white/15 text-white text-[9px] font-semibold px-2 py-1 rounded-lg">{t.provider}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">{t.title}</h3>
                    <p className="text-white/65 text-xs mt-1 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      {t.city}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/50 text-[9px] uppercase tracking-wide">From</p>
                      <p className="text-white font-bold text-lg leading-tight">£{t.price}<span className="text-white/50 text-[10px] font-normal">/person</span></p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-400"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                      <span className="text-white text-xs font-bold">{t.rating}</span>
                    </div>
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
              {results.length} Tour{results.length !== 1 ? "s" : ""}
              {hasFilters && <span className="text-emerald-500 ml-1 text-xs font-normal">(filtered)</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); }} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-xl active:scale-95">Clear</button>
            )}
            <button type="button" onClick={() => setSortOpen((v) => !v)}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold active:scale-95 shadow-sm ${
                sortBy !== "default" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
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
            <p className="font-bold text-slate-700 mb-1">No tours found</p>
            <p className="text-slate-400 text-sm text-center">Try different search or filters</p>
            <button type="button" onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); }} className="mt-4 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95">Reset all</button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((t) => (
              <div key={t.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.99] transition-transform">
                <div className={`bg-gradient-to-r ${t.gradient} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{t.tag}</span>
                    <span className="text-white/80 text-[10px] font-medium">{t.duration}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${t.provider === "GetYourGuide" ? "bg-orange-500/80 text-white" : "bg-blue-500/80 text-white"}`}>
                    {t.provider === "GetYourGuide" ? "GYG" : "Viator"}
                  </span>
                </div>
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1">{t.title}</h3>
                    <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{t.category}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1 mb-2">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    {t.area}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Stars rating={t.rating} />
                    <span className="text-[10px] font-bold text-slate-700">{t.rating}</span>
                    <span className="text-slate-300 text-[10px]">({t.reviews.toLocaleString()} reviews)</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                      {t.groupSize}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      {t.included[0]} incl.
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">From</p>
                      <p className="text-emerald-600 font-bold text-base leading-tight">£{t.price}<span className="text-slate-400 text-[10px] font-normal"> /person</span></p>
                    </div>
                    <button type="button" className="bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl active:scale-95 shadow-sm shadow-emerald-200">Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
