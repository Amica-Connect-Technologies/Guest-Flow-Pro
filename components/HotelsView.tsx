"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, Clock, Wifi, ChevronRight, Building2, X, SlidersHorizontal } from "lucide-react";
import { hotelsApi, type Hotel } from "@/lib/api";

const PALETTE = [
  { from: "#1a1a2e", via: "#16213e", to: "#0f3460" },
  { from: "#2d1b69", via: "#11998e", to: "#38ef7d" },
  { from: "#c94b4b", via: "#4b134f", to: "#c94b4b" },
  { from: "#134e5e", via: "#71b280", to: "#134e5e" },
  { from: "#373b44", via: "#4286f4", to: "#373b44" },
  { from: "#7b4397", via: "#dc2430", to: "#7b4397" },
  { from: "#0f2027", via: "#203a43", to: "#2c5364" },
  { from: "#1d4350", via: "#a43931", to: "#1d4350" },
];

function paletteFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return PALETTE[n % PALETTE.length];
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

  const featured = useMemo(() => hotels.slice(0, 6), [hotels]);
  const hasFilters = !!search || sortBy !== "default";

  return (
    <div className="min-h-screen" style={{ background: "#F4F1EC", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Hero Header ──────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0B1426 0%, #1a2744 50%, #0d1f3c 100%)" }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#C9A84C" }}>
            Amica International
          </p>
          <h1 className="text-2xl font-black text-white mb-1 leading-tight">
            Our Hotels
          </h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {loading ? "Loading…" : `${hotels.length} premium propert${hotels.length !== 1 ? "ies" : "y"}`}
          </p>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              type="text"
              placeholder="Search by hotel or city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 text-sm font-medium rounded-2xl border-0 focus:outline-none focus:ring-2"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                backdropFilter: "blur(10px)",
                focusRingColor: "#C9A84C",
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "#C9A84C", borderTopColor: "transparent" }} />
          <p className="text-sm font-semibold" style={{ color: "#8a7a6a" }}>Loading hotels…</p>
        </div>
      )}

      {!loading && (
        <div className="max-w-lg mx-auto">

          {/* ── Featured Carousel ──────────────────────────────── */}
          {!search && featured.length > 0 && (
            <section className="pt-5 pb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "#C9A84C" }}>Featured</p>
                  <h2 className="text-base font-black" style={{ color: "#1a1a2e" }}>Top Properties</h2>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#1a1a2e", color: "#C9A84C" }}>
                  {featured.length} Hotels
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
                {featured.map((h, idx) => {
                  const pal = paletteFor(h.id);
                  return (
                    <Link key={h.id} href={`/h/${h.id}`}
                      className="flex-shrink-0 w-52 rounded-3xl overflow-hidden active:scale-95 transition-all duration-200"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                      {/* Card top */}
                      <div className="relative h-32 flex flex-col justify-between p-4"
                        style={{ background: `linear-gradient(135deg, ${pal.from}, ${pal.via}, ${pal.to})` }}>
                        <div className="absolute inset-0 opacity-20"
                          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-full"
                            style={{ background: "rgba(201,168,76,0.25)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)" }}>
                            #{idx + 1} Property
                          </span>
                          {h.logo_url ? (
                            <Image unoptimized src={h.logo_url} alt={h.name} width={32} height={32}
                              className="w-8 h-8 rounded-xl object-cover border-2 border-white/30" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                              {initials(h.name)}
                            </div>
                          )}
                        </div>
                        <div className="relative z-10">
                          <h3 className="text-white font-black text-sm leading-tight line-clamp-1">{h.name}</h3>
                          <p className="flex items-center gap-1 mt-0.5" style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px" }}>
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            {h.city}
                          </p>
                        </div>
                      </div>
                      {/* Card bottom */}
                      <div className="bg-white px-4 py-3 flex items-center justify-between">
                        <div>
                          {h.amenities?.length > 0 ? (
                            <p className="text-[10px] font-semibold" style={{ color: "#8a7a6a" }}>
                              {h.amenities.slice(0, 2).join(" · ")}
                            </p>
                          ) : (
                            <p className="text-[10px] font-semibold" style={{ color: "#8a7a6a" }}>Digital Concierge</p>
                          )}
                          <p className="text-[10px] font-bold mt-0.5" style={{ color: "#1a1a2e" }}>
                            {h.is_24_7 ? "Open 24/7" : "View Details"}
                          </p>
                        </div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "#1a1a2e" }}>
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── List Header ────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: "#C9A84C" }}>
                {hasFilters ? "Filtered" : "All Properties"}
              </p>
              <h2 className="text-base font-black" style={{ color: "#1a1a2e" }}>
                {results.length} Hotel{results.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="flex gap-2">
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl"
                  style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
              <button type="button" onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                style={sortBy !== "default"
                  ? { background: "#1a1a2e", color: "#C9A84C" }
                  : { background: "white", color: "#1a1a2e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {sortBy !== "default" ? SORT_OPTIONS.find(o => o.value === sortBy)!.label : "Sort"}
              </button>
            </div>
          </div>

          {/* Sort dropdown */}
          {sortOpen && (
            <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              {SORT_OPTIONS.map((opt, i) => (
                <button key={opt.value} type="button"
                  onClick={() => { setSortBy(opt.value as SortValue); setSortOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold active:bg-slate-50 transition-colors"
                  style={{
                    color: sortBy === opt.value ? "#C9A84C" : "#1a1a2e",
                    borderTop: i > 0 ? "1px solid #f1f0ed" : "none",
                    background: sortBy === opt.value ? "#fdf8ef" : "white",
                  }}>
                  {opt.label}
                  {sortBy === opt.value && <div className="w-2 h-2 rounded-full" style={{ background: "#C9A84C" }} />}
                </button>
              ))}
            </div>
          )}

          {/* ── Hotel Cards ────────────────────────────────────── */}
          <div className="px-4 pb-28 space-y-3">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  <Building2 className="w-9 h-9" style={{ color: "#c4b9a8" }} />
                </div>
                <p className="font-black text-lg mb-1" style={{ color: "#1a1a2e" }}>No Hotels Found</p>
                <p className="text-sm mb-5" style={{ color: "#8a7a6a" }}>Try a different search term</p>
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="text-sm font-bold px-6 py-3 rounded-2xl text-white"
                  style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)" }}>
                  Reset Search
                </button>
              </div>
            ) : results.map(h => {
              const pal = paletteFor(h.id);
              return (
                <div key={h.id} className="rounded-3xl overflow-hidden" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  <div className="flex">
                    {/* Color swatch with logo */}
                    <div className="w-24 flex-shrink-0 relative flex items-center justify-center"
                      style={{ background: `linear-gradient(160deg, ${pal.from}, ${pal.via})`, minHeight: 120 }}>
                      <div className="absolute inset-0 opacity-30"
                        style={{ backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2), transparent 70%)" }} />
                      {h.logo_url ? (
                        <Image unoptimized src={h.logo_url} alt={h.name} width={52} height={52}
                          className="relative z-10 w-13 h-13 rounded-2xl object-cover border-2 border-white/30"
                          style={{ width: 52, height: 52 }} />
                      ) : (
                        <div className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }}>
                          <span className="text-white font-black text-lg">{initials(h.name)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-black text-sm leading-tight flex-1" style={{ color: "#1a1a2e" }}>{h.name}</h3>
                        {h.is_24_7 && (
                          <span className="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "#ecfdf5", color: "#059669" }}>24/7</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mb-2" style={{ color: "#8a7a6a" }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#C9A84C" }} />
                        <span className="text-xs font-semibold truncate">
                          {h.address ? `${h.address}, ${h.city}` : h.city}
                        </span>
                      </div>

                      {!h.is_24_7 && (
                        <div className="flex items-center gap-1 mb-2" style={{ color: "#8a7a6a" }}>
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs">{h.open_time || "09:00"} – {h.close_time || "22:00"}</span>
                        </div>
                      )}

                      {h.wifi_info && (
                        <div className="flex items-center gap-1 mb-2" style={{ color: "#8a7a6a" }}>
                          <Wifi className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs truncate">{h.wifi_info}</span>
                        </div>
                      )}

                      {h.amenities?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-3">
                          {h.amenities.slice(0, 3).map(a => (
                            <span key={a} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "#fdf8ef", color: "#92691f", border: "1px solid #f0e0b0" }}>
                              {a}
                            </span>
                          ))}
                          {h.amenities.length > 3 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "#f4f1ec", color: "#8a7a6a" }}>
                              +{h.amenities.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {h.whatsapp_number && (
                          <a href={`https://wa.me/${h.whatsapp_number.replace(/\D/g, "")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                            onClick={e => e.stopPropagation()}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: "#16a34a" }}>
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        <Link href={`/h/${h.id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white active:scale-95 transition-transform"
                          style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", boxShadow: "0 4px 12px rgba(11,20,38,0.3)" }}>
                          View Concierge
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
