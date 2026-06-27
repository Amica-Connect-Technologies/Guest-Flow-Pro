"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { placesApi, type Place } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const CATEGORY_VALUES = ["All", "restaurant", "museum", "cafe", "attraction", "shop", "parking", "nightlife"] as const;

const TYPE_CONFIG: Record<string, { bg: string; text: string; accent: string; icon: ReactNode }> = {
  restaurant: { bg: "#FFF7ED", text: "#C2410C", accent: "#F97316", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v3.41a3 3 0 01-1.5 2.598V18.75h15v-2.134a3 3 0 01-1.5-2.598v-3.41" /></svg> },
  museum:     { bg: "#FAF5FF", text: "#7E22CE", accent: "#9333EA", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg> },
  cafe:       { bg: "#FFFBEB", text: "#B45309", accent: "#F59E0B", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 1.265l.39 3.905A2.25 2.25 0 0118.393 22.5H5.607a2.25 2.25 0 01-2.247-2.326l.39-3.905A2.25 2.25 0 015.2 15M19.8 15H4.2" /></svg> },
  attraction: { bg: "#EFF6FF", text: "#1D4ED8", accent: "#2563EB", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
  shop:       { bg: "#ECFDF5", text: "#065F46", accent: "#10B981", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg> },
  parking:    { bg: "#F8FAFC", text: "#475569", accent: "#64748B", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5a3 3 0 010 6h-6v6m-1.5-12v12" /></svg> },
  nightlife:  { bg: "#EEF2FF", text: "#4338CA", accent: "#6366F1", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> },
  other:      { bg: "#F8FAFC", text: "#64748B", accent: "#94A3B8", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
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
    { value: "name"    as const, label: t.places.nameAZ },
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
  const sortRef = useRef<HTMLDivElement>(null);

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

  // Close sort dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

  const hasFilters = category !== "All" || search || sortBy !== "default" || city;

  return (
    <div className="min-h-screen" style={{ background: "#ECEEF3" }}>

      {/* ══════════════════════════════════════════
          HERO  with city search
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #020B12 0%, #083344 35%, #0A4A5E 65%, #0E7490 100%)" }}>
        {/* Dot texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(103,232,249,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(2,11,18,0.25))" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-12">

            {/* Left: title */}
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-[11px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "rgba(196,181,253,0.8)" }}>
                  {t.places.results}
                </span>
              </div>
              <h1 className="text-white font-black leading-none mb-3"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
                Explore Places
              </h1>
              <p style={{ fontSize: "clamp(0.875rem, 1.5vw, 1rem)", color: "rgba(255,255,255,0.45)" }}
                className="max-w-md leading-relaxed">
                Discover restaurants, museums, attractions &amp; more — all in one place
              </p>
            </div>

            {/* Right: search form */}
            <div className="w-full md:w-[420px] flex-shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); setCity(cityInput.trim()); }}
                className="flex gap-2">
                <div className="relative flex-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t.places.searchPlaceholder}
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-semibold outline-none"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "white",
                    }}
                  />
                </div>
                <button type="submit"
                  className="px-6 py-3.5 rounded-2xl text-sm font-black text-white flex-shrink-0 transition-opacity hover:opacity-90"
                  style={{ background: "#7C3AED", boxShadow: "0 4px 16px rgba(124,58,237,0.45)" }}>
                  {t.places.search}
                </button>
              </form>
              {city && (
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Showing results for:
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(124,58,237,0.3)", color: "#C4B5FD" }}>
                    📍 {city}
                    <button onClick={() => { setCityInput(""); setCity(""); }}
                      className="ml-0.5 hover:opacity-70" style={{ touchAction: "manipulation" }}>✕</button>
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILTER BAR  (sticky)
      ══════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 pt-3 pb-3"
        style={{ background: "#ECEEF3", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center gap-3">

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto flex-1 min-w-0 pb-0.5" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                style={{
                  touchAction: "manipulation",
                  background: category === cat.value ? "linear-gradient(135deg, #7C3AED, #6D28D9)" : "white",
                  boxShadow: category === cat.value ? "0 4px 16px rgba(124,58,237,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl">
                {category === cat.value && (
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)" }}>
                    {TYPE_CONFIG[cat.value]?.icon
                      ? <span className="text-white [&>svg]:w-3 [&>svg]:h-3 [&>svg]:text-white">{TYPE_CONFIG[cat.value]?.icon}</span>
                      : <span className="text-white text-[10px] font-black">✦</span>
                    }
                  </div>
                )}
                <span className="font-black text-[13px] whitespace-nowrap"
                  style={{ color: category === cat.value ? "white" : "#1E293B" }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* Name search */}
          <div className="relative hidden md:block flex-shrink-0 w-[220px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={t.places.filterByName}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "none" }}
            />
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative flex-shrink-0">
            <button type="button" onClick={() => setSortOpen((v) => !v)}
              style={{
                touchAction: "manipulation",
                background: sortBy !== "default" ? "linear-gradient(135deg, #7C3AED, #6D28D9)" : "white",
                boxShadow: sortBy !== "default" ? "0 4px 14px rgba(124,58,237,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4 flex-shrink-0"
                style={{ color: sortBy !== "default" ? "white" : "#64748B" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span className="font-black text-[13px] whitespace-nowrap hidden sm:inline"
                style={{ color: sortBy !== "default" ? "white" : "#1E293B" }}>
                {sortBy !== "default" ? SORT_OPTIONS.find(o => o.value === sortBy)!.label : t.places.sort}
              </span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl overflow-hidden z-40"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 140 }}>
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50"
                    style={{ color: sortBy === opt.value ? "#7C3AED" : "#1E293B" }}>
                    {opt.label}
                    {sortBy === opt.value && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button type="button"
              onClick={() => { setSearch(""); setCategory("All"); setSortBy("default"); setCityInput(""); setCity(""); }}
              style={{ touchAction: "manipulation", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              className="flex-shrink-0 text-xs font-bold text-red-500 bg-white px-3 py-2.5 rounded-2xl hover:bg-red-50 transition-colors">
              {t.places.clear}
            </button>
          )}
        </div>

        {/* Mobile name search */}
        <div className="md:hidden px-4 mt-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={t.places.filterByName}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RESULTS
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-6 pb-28">

        {/* Results meta row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.places.results}</p>
            <h2 className="text-sm font-black text-slate-800 mt-0.5">
              {loading
                ? t.places.loading
                : <>{results.length} <span className="font-semibold text-slate-500">{t.places.place}</span></>
              }
              {hasFilters && !loading && (
                <span className="ml-2 text-[11px] font-semibold text-violet-500">{t.places.filtered}</span>
              )}
            </h2>
          </div>
        </div>

        {/* States */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: "#FEF2F2" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="font-black text-slate-700 mb-1">{t.places.couldNotLoad}</p>
            <p className="text-slate-400 text-sm text-center max-w-xs">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 animate-pulse"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "#F1F5F9" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth={1.5} className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="font-black text-slate-700 text-lg mb-1">{t.places.noPlacesFound}</p>
            <p className="text-slate-400 text-sm text-center max-w-xs">{t.places.tryDifferentCity}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => {
              const cfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.other;
              return (
                <div key={p.id} className="bg-white rounded-3xl flex flex-col"
                  style={{
                    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
                  }}>

                  {/* Card body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Top: icon + name */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center"
                        style={{ background: cfg.bg, color: cfg.text }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{p.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <svg viewBox="0 0 24 24" fill={cfg.accent} className="w-2.5 h-2.5 flex-shrink-0">
                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          <p className="text-slate-400 text-[11px] truncate">{[p.address, p.city].filter(Boolean).join(", ")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                        {p.description}
                      </p>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Type badge */}
                    <span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {t.places.categories[p.type as keyof typeof t.places.categories] ?? p.type}
                    </span>
                  </div>

                  {/* Map CTA */}
                  <a href={mapsLinkFor(p)} target="_blank" rel="noopener noreferrer"
                    style={{ touchAction: "manipulation", background: cfg.accent, color: "white" }}
                    className="flex items-center justify-center gap-2 py-3.5 font-black text-sm transition-opacity hover:opacity-90 rounded-b-3xl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    {t.places.mapButton}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
