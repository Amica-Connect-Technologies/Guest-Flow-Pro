"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { placesApi, type Place } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const CATEGORY_VALUES = ["All", "restaurant", "museum", "cafe", "attraction", "shop", "parking", "nightlife"] as const;

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: ReactNode }> = {
  restaurant: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-100",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v3.41a3 3 0 01-1.5 2.598V18.75h15v-2.134a3 3 0 01-1.5-2.598v-3.41" /></svg> },
  museum:     { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg> },
  cafe:       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 1.265l.39 3.905A2.25 2.25 0 0118.393 22.5H5.607a2.25 2.25 0 01-2.247-2.326l.39-3.905A2.25 2.25 0 015.2 15M19.8 15H4.2" /></svg> },
  attraction: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
  shop:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg> },
  parking:    { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5a3 3 0 010 6h-6v6m-1.5-12v12" /></svg> },
  nightlife:  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-100",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> },
  other:      { bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
};

type SortValue = "default" | "name";

function mapsLinkFor(p: Place): string {
  if (p.google_maps_link) return p.google_maps_link;
  const query = [p.name, p.address, p.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function PlacesView() {
  const { t } = useLanguage();
  const CATEGORIES = CATEGORY_VALUES.map((value) => ({
    value,
    label: t.places.categories[(value === "All" ? "all" : value) as keyof typeof t.places.categories],
  }));
  const SORT_OPTIONS = [
    { value: "default" as const, label: t.places.newest },
    { value: "name" as const,    label: t.places.nameAZ },
  ];

  const [cityInput, setCityInput] = useState("");
  const [city, setCity]           = useState("");
  const [places, setPlaces]       = useState<Place[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy]     = useState<SortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    placesApi
      .list(city || undefined)
      .then((data) => { if (active) setPlaces(data); })
      .catch((err: Error) => { if (active) setError(err.message || t.places.couldNotLoad); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [city]); // eslint-disable-line

  const results = useMemo(() => {
    let list = places.filter((p) => {
      const okCat  = category === "All" || p.type === category;
      const q      = search.toLowerCase();
      const okSrch = !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      return okCat && okSrch;
    });
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [places, search, category, sortBy]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sortBy)!;
  const hasFilters = category !== "All" || search || sortBy !== "default" || city;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── City search ─────────────────────────────────── */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        <form
          onSubmit={(e) => { e.preventDefault(); setCity(cityInput.trim()); }}
          className="relative"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <input
            type="text"
            placeholder={t.places.searchPlaceholder}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className="w-full pl-10 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-violet-600 text-white text-xs font-bold rounded-xl active:scale-95">
            {t.places.search}
          </button>
        </form>
      </div>

      {/* ── Categories ───────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                category === cat.value ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-slate-100 text-slate-500"
              }`}
            >{cat.label}</button>
          ))}
        </div>
      </div>

      {/* ── Filter by name within results ───────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5">
        <input
          type="text"
          placeholder={t.places.filterByName}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* ── Sort Panel ───────────────────────────────────── */}
      {sortOpen && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t.places.sortBy}</p>
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

      {/* ── List ─────────────────────────────────────────── */}
      <section className="px-4 pt-4 pb-28">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.places.results}</p>
            <h2 className="text-sm font-bold text-slate-900">
              {loading ? t.places.loading : `${results.length} ${t.places.place}`}
              {hasFilters && !loading && <span className="text-violet-500 ml-1 text-xs font-normal">{t.places.filtered}</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); setCityInput(""); setCity(""); }} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-xl active:scale-95">{t.places.clear}</button>
            )}
            <button type="button" onClick={() => setSortOpen((v) => !v)}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold active:scale-95 shadow-sm ${
                sortBy !== "default" ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
              {sortBy !== "default" ? activeSort.label : t.places.sort}
            </button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="font-bold text-red-500 mb-1">{t.places.couldNotLoad}</p>
            <p className="text-slate-400 text-sm text-center">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <p className="font-bold text-slate-700 mb-1">{t.places.noPlacesFound}</p>
            <p className="text-slate-400 text-sm text-center">{t.places.tryDifferentCity}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((p) => {
              const cfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.other;
              return (
                <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 active:scale-[0.99] transition-transform">
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl ${cfg.bg} ${cfg.text} flex items-center justify-center border ${cfg.border}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1">{p.name}</h3>
                      </div>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mb-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-violet-500 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        {[p.address, p.city].filter(Boolean).join(", ")}
                      </p>
                      {p.description && (
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 mb-2">{p.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{t.places.categories[p.type as keyof typeof t.places.categories] ?? p.type}</span>
                        <a href={mapsLinkFor(p)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl active:scale-95 shadow-sm shadow-violet-200">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                          {t.places.mapButton}
                        </a>
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
