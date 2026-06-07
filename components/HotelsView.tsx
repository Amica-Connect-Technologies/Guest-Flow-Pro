"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { hotelsApi, type Hotel } from "@/lib/api";

const GRADIENTS = [
  "from-indigo-900 via-blue-800 to-blue-700",
  "from-slate-900 via-slate-800 to-slate-700",
  "from-emerald-900 via-teal-800 to-teal-600",
  "from-amber-900 via-amber-800 to-orange-700",
  "from-purple-900 via-violet-800 to-purple-700",
  "from-rose-900 via-rose-800 to-pink-700",
  "from-cyan-900 via-cyan-800 to-sky-700",
  "from-green-900 via-green-800 to-emerald-700",
];

function gradientFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return GRADIENTS[n % GRADIENTS.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "name",    label: "Name A–Z" },
  { value: "city",    label: "City A–Z" },
];
type SortValue = "default" | "name" | "city";

export default function HotelsView() {
  const [hotels,   setHotels]   = useState<Hotel[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<SortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    hotelsApi.list()
      .then(setHotels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    let list = hotels.filter(h => {
      const q = search.toLowerCase();
      return !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q);
    });
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "city") list = [...list].sort((a, b) => a.city.localeCompare(b.city));
    return list;
  }, [hotels, search, sortBy]);

  const featured = useMemo(() => hotels.slice(0, 5), [hotels]);
  const showFeatured = !search;
  const hasFilters = !!search || sortBy !== "default";
  const activeSort = SORT_OPTIONS.find(o => o.value === sortBy)!;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Search */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search hotels or cities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort panel */}
      {sortOpen && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Sort by</p>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { setSortBy(opt.value as SortValue); setSortOpen(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${sortBy === opt.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading hotels…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Featured strip */}
          {showFeatured && featured.length > 0 && (
            <section className="pt-5 pb-1">
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Our Hotels</p>
                  <h2 className="text-base font-bold text-slate-900">Featured Hotels</h2>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
                {featured.map(h => (
                  <Link key={h.id} href={`/h/${h.id}`}
                    className={`flex-shrink-0 w-56 h-44 rounded-3xl bg-gradient-to-br ${gradientFor(h.id)} p-4 relative overflow-hidden active:scale-95 transition-transform shadow-lg`}>
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-10 -right-4 w-36 h-36 bg-white/5 rounded-full" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        {h.logo_url ? (
                          <Image unoptimized src={h.logo_url} alt={h.name} width={40} height={40}
                            className="w-10 h-10 rounded-xl object-cover border-2 border-white/30 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{initials(h.name)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{h.name}</h3>
                          <p className="text-white/65 text-xs mt-0.5 flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            {h.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {h.amenities?.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {h.amenities.slice(0, 2).map(a => (
                              <span key={a} className="text-[9px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{a}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/50 text-[10px]">Digital Concierge</span>
                        )}
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4 opacity-60 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* List */}
          <section className="px-4 pt-4 pb-28">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Results</p>
                <h2 className="text-sm font-bold text-slate-900">
                  {results.length} Hotel{results.length !== 1 ? "s" : ""}
                  {hasFilters && <span className="text-blue-500 ml-1 text-xs font-normal">(filtered)</span>}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                    className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-xl active:scale-95">
                    Clear
                  </button>
                )}
                <button type="button" onClick={() => setSortOpen(v => !v)}
                  className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold active:scale-95 transition-all shadow-sm ${sortBy !== "default" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                  {sortBy !== "default" ? activeSort.label : "Sort"}
                </button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-700 mb-1">No hotels found</p>
                <p className="text-slate-400 text-sm text-center">Try a different search</p>
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="mt-4 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95">
                  Reset
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map(h => (
                  <div key={h.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.99] transition-transform">
                    <div className="flex gap-0">
                      {/* Logo / gradient swatch */}
                      <div className={`w-28 flex-shrink-0 bg-gradient-to-br ${gradientFor(h.id)} flex flex-col items-center justify-center relative overflow-hidden`}>
                        <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />
                        {h.logo_url ? (
                          <Image unoptimized src={h.logo_url} alt={h.name} width={56} height={56}
                            className="relative z-10 w-14 h-14 rounded-2xl object-cover border-2 border-white/30" />
                        ) : (
                          <span className="relative z-10 text-white font-bold text-2xl font-serif leading-none">
                            {initials(h.name)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-3.5 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{h.name}</h3>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1 mb-1.5">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-blue-500 flex-shrink-0"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                          {h.address ? `${h.address}, ${h.city}` : h.city}
                        </p>

                        {h.amenities?.length > 0 && (
                          <div className="flex gap-1 mb-2.5 flex-wrap">
                            {h.amenities.slice(0, 3).map(a => (
                              <span key={a} className="text-[9px] font-medium text-slate-500 bg-slate-50 rounded-lg px-1.5 py-0.5 border border-slate-100">{a}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {h.is_24_7 ? "24/7 Open" : `${h.open_time || "09:00"} – ${h.close_time || "22:00"}`}
                          </div>
                          <div className="flex items-center gap-2">
                            {h.whatsapp_number && (
                              <a href={`https://wa.me/${h.whatsapp_number.replace(/\D/g, "")}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center active:scale-95"
                                onClick={e => e.stopPropagation()}>
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </a>
                            )}
                            <Link href={`/h/${h.id}`}
                              className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 shadow-sm shadow-blue-200">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
