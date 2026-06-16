"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Search, Clock, Wifi, ChevronRight,
  Building2, X, SlidersHorizontal, Phone,
} from "lucide-react";
import { hotelsApi, type Hotel } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

/* ── Palette ──────────────────────────────────────────────────────────────── */
const PALETTE = [
  ["#0f2027", "#203a43", "#2c5364"],
  ["#1a1a2e", "#16213e", "#0f3460"],
  ["#134e5e", "#366972", "#71b280"],
  ["#2d1b69", "#553c9a", "#4a6fa5"],
  ["#3c1053", "#ad5389", "#6b3fa0"],
  ["#7b4397", "#9b4dca", "#6b2fa0"],
  ["#1d4350", "#a43931", "#8b2635"],
  ["#373b44", "#4286f4", "#2f6eb5"],
];

function paletteFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return PALETTE[n % PALETTE.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const SORT_VALUES = ["default", "name", "city"] as const;
type SortValue = (typeof SORT_VALUES)[number];

const GOLD = "#C9A84C";
const NAVY = "#0B1426";

/* ── Component ────────────────────────────────────────────────────────────── */
export default function HotelsView() {
  const { t } = useLanguage();
  const [hotels,   setHotels]   = useState<Hotel[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<SortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);

  const sortLabels: Record<SortValue, string> = {
    default: t.hotels.defaultOrder,
    name: t.hotels.nameAZ,
    city: t.hotels.cityAZ,
  };

  useEffect(() => {
    hotelsApi.list().then(setHotels).catch(() => {}).finally(() => setLoading(false));
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

  const featured   = useMemo(() => hotels.slice(0, 6), [hotels]);
  const hasFilters = !!search || sortBy !== "default";

  return (
    <div className="min-h-screen" style={{ background: "#F0EDE8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #1a2744 55%, #0d2040 100%)` }}>
        {/* Top accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        <div className="px-5 pt-7 pb-7">
          {/* Brand line */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-8 rounded-full" style={{ background: GOLD }} />
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: GOLD }}>{t.hotels.brandLine}</p>
              <p className="text-white text-[11px] font-medium opacity-60">{t.hotels.platformLine}</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-white leading-tight mb-1">
            {t.hotels.pageTitle}
          </h1>
          <p className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {loading ? t.hotels.loadingProperties : `${hotels.length} ${hotels.length !== 1 ? t.hotels.propertiesAvailable : t.hotels.propertyAvailable}`}
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(255,255,255,0.35)" }} />
            <input
              type="text"
              placeholder={t.hotels.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-4 text-sm font-semibold rounded-2xl border-0 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
            {search ? (
              <button type="button" onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: `rgba(201,168,76,0.25)` }}>
                <Search className="w-3 h-3" style={{ color: GOLD }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-36 gap-4">
          <div className="w-14 h-14 rounded-full border-[3px] animate-spin"
            style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }} />
          <p className="text-sm font-bold" style={{ color: "#9a8a78" }}>Loading properties…</p>
        </div>
      )}

      {!loading && (
        <div className="max-w-lg mx-auto">

          {/* ── Featured Carousel ─────────────────────────────────────────── */}
          {!search && featured.length > 0 && (
            <section className="pt-6 pb-2">
              <div className="flex items-center justify-between px-5 mb-4">
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: GOLD }}>{t.hotels.featuredTag}</p>
                  <h2 className="text-xl font-black" style={{ color: NAVY }}>{t.hotels.topProperties}</h2>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-black"
                  style={{ background: NAVY, color: GOLD }}>
                  {featured.length} {t.hotels.hotelsCount}
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto px-5 pb-3" style={{ scrollbarWidth: "none" }}>
                {featured.map((h, idx) => {
                  const pal = paletteFor(h.id);
                  return (
                    <Link key={h.id} href={`/h/${h.id}`}
                      className="flex-shrink-0 w-60 rounded-3xl overflow-hidden active:scale-95 transition-all duration-200"
                      style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}>

                      {/* Top gradient */}
                      <div className="relative h-40 flex flex-col justify-between p-4"
                        style={{ background: `linear-gradient(150deg, ${pal[0]}, ${pal[1]}, ${pal[2]})` }}>
                        <div className="absolute inset-0"
                          style={{ backgroundImage: "radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.15) 0%, transparent 55%)" }} />

                        {/* Badge + logo row */}
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                            style={{ background: `rgba(201,168,76,0.2)`, color: GOLD, border: `1px solid rgba(201,168,76,0.35)` }}>
                            #{idx + 1} {t.hotels.property}
                          </span>
                          {h.logo_url ? (
                            <Image unoptimized src={h.logo_url} alt={h.name} width={36} height={36}
                              className="w-9 h-9 rounded-xl object-cover border-2 border-white/25" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                              style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.25)", color: "white" }}>
                              {initials(h.name)}
                            </div>
                          )}
                        </div>

                        {/* Name + city */}
                        <div className="relative z-10">
                          <h3 className="text-white font-black text-base leading-tight line-clamp-1">{h.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{h.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom white strip */}
                      <div className="bg-white px-4 py-3.5 flex items-center justify-between"
                        style={{ borderTop: `2px solid ${GOLD}22` }}>
                        <div className="flex-1 min-w-0">
                          {h.amenities?.length > 0 ? (
                            <p className="text-xs font-semibold truncate" style={{ color: "#8a7a6a" }}>
                              {h.amenities.slice(0, 2).join(" · ")}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold" style={{ color: "#8a7a6a" }}>{t.hotels.digitalConcierge}</p>
                          )}
                          <p className="text-xs font-black mt-0.5" style={{ color: NAVY }}>
                            {h.is_24_7 ? t.hotels.open247 : t.hotels.viewDetailsArrow}
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center ml-3 flex-shrink-0"
                          style={{ background: NAVY }}>
                          <ChevronRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── List Header ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: GOLD }}>
                {hasFilters ? t.hotels.filteredResults : t.hotels.allProperties}
              </p>
              <h2 className="text-xl font-black" style={{ color: NAVY }}>
                {results.length} {t.hotels.hotelsCount}
              </h2>
            </div>
            <div className="flex gap-2.5">
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2.5 rounded-xl"
                  style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <X className="w-3.5 h-3.5" /> {t.hotels.clear}
                </button>
              )}
              <button type="button" onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all"
                style={sortBy !== "default"
                  ? { background: NAVY, color: GOLD, boxShadow: `0 4px 14px ${NAVY}55` }
                  : { background: "white", color: NAVY, boxShadow: "0 2px 10px rgba(0,0,0,0.09)" }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {sortBy !== "default" ? sortLabels[sortBy] : t.hotels.sort}
              </button>
            </div>
          </div>

          {/* Sort panel */}
          {sortOpen && (
            <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.05)" }}>
              {SORT_VALUES.map((value, i) => (
                <button key={value} type="button"
                  onClick={() => { setSortBy(value); setSortOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold active:bg-slate-50 transition-colors"
                  style={{
                    color: sortBy === value ? GOLD : NAVY,
                    borderTop: i > 0 ? "1px solid #f0ede8" : "none",
                    background: sortBy === value ? "#fdf8ef" : "white",
                  }}>
                  {sortLabels[value]}
                  {sortBy === value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />}
                </button>
              ))}
            </div>
          )}

          {/* ── Hotel Cards ───────────────────────────────────────────────── */}
          <div className="px-5 pb-32 space-y-4">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.09)" }}>
                  <Building2 className="w-11 h-11" style={{ color: "#c4b9a8" }} />
                </div>
                <p className="text-xl font-black mb-2" style={{ color: NAVY }}>{t.hotels.noHotelsFound}</p>
                <p className="text-sm mb-6" style={{ color: "#9a8a78" }}>{t.hotels.tryDifferentSearch}</p>
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="text-sm font-black px-8 py-3.5 rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, #1a2f5c)`, boxShadow: `0 6px 20px ${NAVY}44` }}>
                  {t.hotels.resetSearch}
                </button>
              </div>
            ) : results.map(h => {
              const pal = paletteFor(h.id);
              return (
                <div key={h.id} className="rounded-3xl overflow-hidden"
                  style={{ background: "white", boxShadow: "0 6px 28px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.04)" }}>

                  {/* ── Card header: full-width gradient banner ── */}
                  <div className="relative px-5 py-5"
                    style={{ background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})` }}>
                    <div className="absolute inset-0"
                      style={{ backgroundImage: "radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
                    <div className="flex items-center gap-4 relative z-10">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {h.logo_url ? (
                          <Image unoptimized src={h.logo_url} alt={h.name} width={60} height={60}
                            className="w-15 h-15 rounded-2xl object-cover"
                            style={{ width: 60, height: 60, border: "2.5px solid rgba(255,255,255,0.3)" }} />
                        ) : (
                          <div className="w-15 h-15 rounded-2xl flex items-center justify-center"
                            style={{ width: 60, height: 60, background: "rgba(255,255,255,0.18)", border: "2.5px solid rgba(255,255,255,0.28)" }}>
                            <span className="text-white font-black text-xl">{initials(h.name)}</span>
                          </div>
                        )}
                      </div>
                      {/* Name + location */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-lg leading-tight line-clamp-1">{h.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                          <span className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                            {h.address ? `${h.address}, ${h.city}` : h.city}
                          </span>
                        </div>
                      </div>
                      {h.is_24_7 && (
                        <span className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(52,211,153,0.25)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}>
                          24/7
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div className="px-5 pt-4 pb-5">
                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                      {!h.is_24_7 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" style={{ color: GOLD }} />
                          <span className="text-xs font-semibold" style={{ color: "#6b6058" }}>
                            {h.open_time || "09:00"} – {h.close_time || "22:00"}
                          </span>
                        </div>
                      )}
                      {h.wifi_info && (
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5" style={{ color: GOLD }} />
                          <span className="text-xs font-semibold truncate max-w-[140px]" style={{ color: "#6b6058" }}>{h.wifi_info}</span>
                        </div>
                      )}
                      {h.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" style={{ color: GOLD }} />
                          <span className="text-xs font-semibold" style={{ color: "#6b6058" }}>{h.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    {h.amenities?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-5">
                        {h.amenities.slice(0, 4).map(a => (
                          <span key={a} className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: "#fdf8ef", color: "#7a5c1e", border: `1px solid ${GOLD}44` }}>
                            {a}
                          </span>
                        ))}
                        {h.amenities.length > 4 && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: "#f0ede8", color: "#8a7a6a" }}>
                            +{h.amenities.length - 4} {t.hotels.moreLabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      {h.whatsapp_number && (
                        <a href={`https://wa.me/${h.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black active:scale-95 transition-transform flex-shrink-0"
                          style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }}
                          onClick={e => e.stopPropagation()}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {t.hotels.whatsapp}
                        </a>
                      )}
                      <Link href={`/h/${h.id}`}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-black text-white active:scale-95 transition-transform"
                        style={{
                          background: `linear-gradient(135deg, ${NAVY} 0%, #1a2f5c 100%)`,
                          boxShadow: `0 6px 20px ${NAVY}45`,
                        }}>
                        {t.hotels.viewConcierge}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
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
