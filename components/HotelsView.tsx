"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Search, Clock, Wifi, ChevronRight,
  Building2, X, SlidersHorizontal, Phone, ConciergeBell, Smartphone,
} from "lucide-react";
import { hotelsApi, type Hotel } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

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

const GOLD  = "#C9A84C";
const NAVY  = "#0B1426";
const GOLD2 = "#E8C96A";

export default function HotelsView() {
  const { t } = useLanguage();
  const [hotels,   setHotels]   = useState<Hotel[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<SortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);

  const sortLabels: Record<SortValue, string> = {
    default: t.hotels.defaultOrder,
    name:    t.hotels.nameAZ,
    city:    t.hotels.cityAZ,
  };

  useEffect(() => {
    hotelsApi.list()
      .then(all => setHotels(all.filter(h => h.is_verified)))
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

  const noMatch    = !!search && results.length === 0;
  const featured   = useMemo(() => {
    if (search && results.length > 0) return results.slice(0, 6);
    if (search && results.length === 0) return hotels.slice(0, 6); // fallback
    return hotels.slice(0, 6);
  }, [hotels, results, search]);
  const hasFilters = !!search || sortBy !== "default";

  return (
    <div className="min-h-screen" style={{ background: "#F0EDE8" }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div style={{ background: `linear-gradient(145deg, #050e1f 0%, #0d1f3c 45%, #0f2d4a 100%)`, position: "relative", overflow: "hidden" }}>

        {/* Background decoration */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.35,
          backgroundImage: `radial-gradient(${GOLD}22 1px, transparent 1px)`,
          backgroundSize: "36px 36px" }} />
        <div style={{ position: "absolute", top: -120, right: "5%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,100,160,0.22) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "15%", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Gold top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, ${GOLD2} 60%, transparent 100%)` }} />

        <div className="max-w-7xl mx-auto px-6 md:px-14 pt-12 md:pt-20 pb-14 md:pb-20" style={{ position: "relative", zIndex: 1 }}>
          <div className="flex flex-col md:flex-row md:items-center md:gap-16">

            {/* ── Left: copy ── */}
            <div className="flex-1 mb-10 md:mb-0">

              {/* Brand pill */}
              <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                <span className="text-[11px] font-black tracking-[0.22em] uppercase" style={{ color: GOLD }}>
                  {t.hotels.brandLine}
                </span>
              </div>

              <h1 className="font-black text-white tracking-tight mb-5"
                style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", lineHeight: 1.08 }}>
                {(() => {
                  const words = t.hotels.pageTitle.split(" ");
                  return (
                    <>
                      <span style={{ display: "block" }}>{words.slice(0, 2).join(" ")}</span>
                      <span style={{ display: "block", color: GOLD }}>{words.slice(2).join(" ")}</span>
                    </>
                  );
                })()}
              </h1>

              <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 360 }}>
                {t.hotels.pageSubtitle}
              </p>

              {/* Benefits list */}
              <div className="flex flex-col gap-3">
                {[
                  "Digital Check-in",
                  "Local Recommendations",
                  "Airport Transfers",
                  "Hotel Services",
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, boxShadow: `0 2px 8px ${GOLD}44` }}>
                      <span style={{ color: "#1a1000", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: search card ── */}
            <div className="md:w-[420px] md:flex-shrink-0">
              <div className="rounded-3xl p-6 md:p-7"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>

                <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Find your hotel
                </p>

                {/* Search input */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="text"
                    placeholder={t.hotels.searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 text-sm font-semibold rounded-2xl border-0 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.1)", color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
                  />
                  {search ? (
                    <button type="button" onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.15)" }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  ) : null}
                </div>

                {/* Stats row inside card */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: loading ? "—" : String(hotels.length), label: "Hotels" },
                    { value: loading ? "—" : String(new Set(hotels.map(h => h.city)).size), label: "Cities" },
                    { value: "24/7", label: "Support" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-lg font-black" style={{ color: GOLD }}>{s.value}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <svg viewBox="0 0 1440 40" className="w-full block" style={{ marginBottom: -2, display: "block" }}
          preserveAspectRatio="none" height={40}>
          <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="#F0EDE8" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          LOADING SKELETON
      ══════════════════════════════════════════ */}
      {loading && (
        <div className="max-w-7xl mx-auto px-6 md:px-14 py-12">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl overflow-hidden animate-pulse flex"
                style={{ background: "white", height: 160 }}>
                <div className="w-[280px] flex-shrink-0" style={{ background: "#dde2ea" }} />
                <div className="flex-1 p-6 space-y-3">
                  <div className="h-4 rounded-xl" style={{ background: "#eef0f4", width: "55%" }} />
                  <div className="h-3 rounded-xl" style={{ background: "#f3f4f6", width: "35%" }} />
                  <div className="flex gap-2 mt-4">
                    <div className="h-7 w-20 rounded-xl" style={{ background: "#f3f4f6" }} />
                    <div className="h-7 w-20 rounded-xl" style={{ background: "#f3f4f6" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto">

          {/* ══════════════════════════════════════════
              FEATURED
          ══════════════════════════════════════════ */}
          {featured.length > 0 && (
            <section className="pt-10 md:pt-12 pb-2">

              {/* Section header */}
              <div className="flex items-center justify-between px-6 md:px-14 mb-7">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-10 rounded-full" style={{ background: `linear-gradient(180deg, ${GOLD}, ${GOLD2})` }} />
                  <div>
                    <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1" style={{ color: GOLD }}>
                      {noMatch ? "SUGGESTED FOR YOU" : search ? "SEARCH RESULTS" : t.hotels.featuredTag}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black" style={{ color: NAVY }}>
                      {noMatch ? "You Might Also Like" : search ? `Results for "${search}"` : t.hotels.topProperties}
                    </h2>
                    {noMatch && (
                      <p className="text-xs mt-1" style={{ color: "#9a8a78" }}>
                        No match for <span className="font-bold" style={{ color: NAVY }}>&ldquo;{search}&rdquo;</span> — showing top properties instead
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-black px-4 py-2.5 rounded-full"
                  style={{ background: NAVY, color: GOLD, letterSpacing: "0.05em" }}>
                  {featured.length} {t.hotels.hotelsCount}
                </span>
              </div>

              {/* Mobile: scroll */}
              <div className="md:hidden flex gap-4 overflow-x-auto px-6 pb-4" style={{ scrollbarWidth: "none" }}>
                {featured.map((h, idx) => <FeaturedCard key={h.id} h={h} idx={idx} t={t} />)}
              </div>

              {/* Desktop: grid */}
              <div className="hidden md:grid grid-cols-3 gap-5 px-14">
                {featured.map((h, idx) => <FeaturedCard key={h.id} h={h} idx={idx} t={t} />)}
              </div>
            </section>
          )}

          {/* Divider */}
          {featured.length > 0 && (
            <div className="mx-6 md:mx-14 my-10 flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: "rgba(11,20,38,0.08)" }} />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "white", border: "1px solid rgba(11,20,38,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                <span className="text-xs font-black" style={{ color: NAVY }}>All Properties</span>
              </div>
              <div className="flex-1 h-px" style={{ background: "rgba(11,20,38,0.08)" }} />
            </div>
          )}

          {/* ══════════════════════════════════════════
              TOOLBAR
          ══════════════════════════════════════════ */}
          <div className="flex items-center justify-between px-6 md:px-14 pb-6">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                {hasFilters ? t.hotels.filteredResults : t.hotels.allProperties}
              </p>
              <h2 className="text-xl font-black mt-0.5" style={{ color: NAVY }}>
                {results.length} {t.hotels.hotelsCount}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(""); setSortBy("default"); }}
                  className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2.5 rounded-xl"
                  style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <X className="w-3.5 h-3.5" /> {t.hotels.clear}
                </button>
              )}
              <div className="relative">
                <button type="button" onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl"
                  style={sortBy !== "default"
                    ? { background: NAVY, color: GOLD, boxShadow: `0 4px 16px ${NAVY}44` }
                    : { background: "white", color: NAVY, boxShadow: "0 2px 12px rgba(0,0,0,0.09)" }}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {sortBy !== "default" ? sortLabels[sortBy] : t.hotels.sort}
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-30"
                    style={{ background: "white", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    {SORT_VALUES.map((value, i) => (
                      <button key={value} type="button"
                        onClick={() => { setSortBy(value); setSortOpen(false); }}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold transition-colors hover:bg-slate-50"
                        style={{
                          color: sortBy === value ? GOLD : NAVY,
                          borderTop: i > 0 ? "1px solid #f0ede8" : "none",
                          background: sortBy === value ? "#fdf8ef" : "transparent",
                        }}>
                        {sortLabels[value]}
                        {sortBy === value && <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              HOTEL CARDS LIST
          ══════════════════════════════════════════ */}
          {!noMatch && (
            <div className="px-6 md:px-14 pb-20">
              <div className="flex flex-col gap-5">
                {results.map(h => <HotelCard key={h.id} h={h} t={t} />)}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ══════════════════════════════════════════
   FEATURED CARD
══════════════════════════════════════════ */
function FeaturedCard({ h, idx, t }: { h: Hotel; idx: number; t: ReturnType<typeof useLanguage>["t"] }) {
  const pal = paletteFor(h.id);
  const hasConcierge = ["concierge", "concierge_checkin", "full"].includes(h.plan);
  const hasCheckin = ["checkin", "concierge_checkin", "full"].includes(h.plan);
  return (
    <Link href={`/hotels/${h.id}`}
      className="flex-shrink-0 w-64 md:w-full rounded-3xl overflow-hidden block"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)", transition: "transform 0.28s ease, box-shadow 0.28s ease" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-8px) scale(1.01)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 56px rgba(0,0,0,0.26)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)";
      }}>

      {/* Gradient / photo top */}
      <div className="relative flex flex-col justify-between p-5"
        style={{ height: 200, background: `linear-gradient(150deg, ${pal[0]}, ${pal[1]}, ${pal[2]})` }}>

        {/* Gallery photo */}
        {h.gallery_images?.[0]?.image_url && (
          <Image unoptimized src={h.gallery_images[0].image_url} alt={h.name}
            fill className="object-cover" style={{ zIndex: 0 }} />
        )}

        {/* No gallery → show logo large & centered */}
        {!h.gallery_images?.[0]?.image_url && h.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
            <div className="rounded-2xl p-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.22)" }}>
              <Image unoptimized src={h.logo_url} alt={h.name} width={80} height={80}
                className="object-contain rounded-xl"
                style={{ width: 80, height: 80 }} />
            </div>
          </div>
        )}

        {/* No gallery, no logo → building icon */}
        {!h.gallery_images?.[0]?.image_url && !h.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
            <Building2 className="w-16 h-16" style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
          background: h.gallery_images?.[0]?.image_url
            ? "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.70) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)",
        }} />

        {/* Top row: rank badge only (no redundant logo thumbnail) */}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(201,168,76,0.18)", color: GOLD, border: "1px solid rgba(201,168,76,0.35)" }}>
            #{idx + 1} {t.hotels.property}
          </span>
          {/* Show small logo badge only when gallery photo is present (not redundant) */}
          {h.gallery_images?.[0]?.image_url && h.logo_url && (
            <Image unoptimized src={h.logo_url} alt={h.name} width={32} height={32}
              className="rounded-xl object-cover"
              style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.3)" }} />
          )}
        </div>

        {/* Bottom: name + city + stars */}
        <div className="relative z-10">
          <h3 className="text-white font-black text-base leading-snug line-clamp-2 mb-1.5">{h.name}</h3>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{h.city}</span>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: GOLD, fontSize: 11 }}>★</span>
            ))}
          </div>
        </div>
      </div>

      {/* White bottom: badges + CTA */}
      <div className="bg-white px-4 pt-3.5 pb-4" style={{ borderTop: `2px solid ${GOLD}20` }}>
        {/* Service badges */}
        <div className="flex flex-col gap-1.5 mb-3">
          {hasConcierge && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7C3AED" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#5b21b6" }}>Digital Concierge Available</span>
            </div>
          )}
          {hasCheckin && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0891B2" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#0e7490" }}>Digital Check-in Available</span>
            </div>
          )}
          {!hasConcierge && !hasCheckin && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
              <span className="text-[11px] font-semibold" style={{ color: "#7a5c1e" }}>{t.hotels.digitalConcierge}</span>
            </div>
          )}
        </div>

        {/* CTA row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black" style={{ color: NAVY }}>Book Your Stay Here</span>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-white"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #1e3a6e)` }}>
            Open <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════
   HOTEL LIST CARD
══════════════════════════════════════════ */
function formatTag(raw: string) {
  return raw.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function HotelCard({ h, t }: { h: Hotel; t: ReturnType<typeof useLanguage>["t"] }) {
  const pal = paletteFor(h.id);
  const hasInfo = (!h.is_24_7 && (h.open_time || h.close_time)) || h.wifi_info || h.phone;
  const hasConcierge = ["concierge", "concierge_checkin", "full"].includes(h.plan);
  const hasCheckin   = ["checkin",   "concierge_checkin", "full"].includes(h.plan);

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1px solid rgba(11,20,38,0.06)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 52px rgba(0,0,0,0.13)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
      }}>

      <div className="flex flex-col md:flex-row">

        {/* ── Banner ── */}
        <div
          className="relative w-full md:w-[272px] md:flex-shrink-0 flex flex-col justify-between p-6 md:p-7"
          style={{
            minHeight: 180,
            background: `linear-gradient(150deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[2]} 100%)`,
          }}>
          {h.gallery_images?.[0]?.image_url && (
            <Image unoptimized src={h.gallery_images[0].image_url} alt={h.name}
              fill className="object-cover" style={{ zIndex: 0 }} />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
            background: h.gallery_images?.[0]?.image_url
              ? "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.65) 100%)"
              : "radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.13) 0%, transparent 58%)",
          }} />
          <div className="hidden md:block absolute inset-y-0 right-0 w-10 pointer-events-none"
            style={{ zIndex: 2, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.14))" }} />

          {/* Logo + 24/7 */}
          <div className="relative z-10 flex items-start justify-between">
            {h.logo_url ? (
              <Image unoptimized src={h.logo_url} alt={h.name} width={54} height={54}
                className="rounded-2xl object-cover flex-shrink-0"
                style={{ width: 54, height: 54, border: "2.5px solid rgba(255,255,255,0.32)" }} />
            ) : (
              <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ width: 54, height: 54, background: "rgba(255,255,255,0.18)", border: "2.5px solid rgba(255,255,255,0.28)" }}>
                <span className="text-white font-black text-xl">{initials(h.name)}</span>
              </div>
            )}
            {h.is_24_7 && (
              <span className="text-[9px] font-black px-2.5 py-1.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.22)", color: "#34d399", border: "1px solid rgba(52,211,153,0.4)" }}>
                24/7
              </span>
            )}
          </div>

          {/* Name + address */}
          <div className="relative z-10 mt-5">
            <h3 className="text-white font-black text-xl leading-snug mb-2" style={{ lineClamp: 2 }}>{h.name}</h3>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                {h.address ? `${h.address}, ${h.city}` : h.city}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col p-5 md:px-7 md:py-6 gap-4">

          {/* Info pills row */}
          {hasInfo && (
            <div className="flex flex-wrap gap-2">
              {!h.is_24_7 && (h.open_time || h.close_time) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: "#fdf8ef", border: `1px solid ${GOLD}30` }}>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                  <span className="text-xs font-semibold" style={{ color: "#7a5c1e" }}>
                    {h.open_time || "09:00"} – {h.close_time || "22:00"}
                  </span>
                </div>
              )}
              {h.wifi_info && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: "#eff8ff", border: "1px solid #bfdbfe" }}>
                  <Wifi className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#3b82f6" }} />
                  <span className="text-xs font-semibold truncate max-w-[130px]" style={{ color: "#1d4ed8" }}>{h.wifi_info}</span>
                </div>
              )}
              {h.phone && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#16a34a" }} />
                  <span className="text-xs font-semibold" style={{ color: "#15803d" }}>{h.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Amenity tags — formatted labels */}
          {h.amenities?.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {h.amenities.slice(0, 5).map(a => (
                <span key={a} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: "#f2f0ec", color: "#5a4a38", border: "1px solid #e2dbd0" }}>
                  {formatTag(a)}
                </span>
              ))}
              {h.amenities.length > 5 && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: NAVY, color: GOLD, border: `1px solid ${NAVY}` }}>
                  +{h.amenities.length - 5} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs font-medium" style={{ color: "#b0a898" }}>
              {t.hotels.digitalConcierge}
            </p>
          )}

          {/* Spacer pushes buttons to bottom */}
          <div className="flex-1" />

          {/* Separator */}
          <div style={{ height: 1, background: "rgba(11,20,38,0.06)" }} />

          {/* CTA buttons — plan-based */}
          <div className="flex flex-wrap gap-2">

            {/* WhatsApp — always first if available */}
            {h.whatsapp_number && (
              <a href={`https://wa.me/${h.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold flex-shrink-0"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }}
                onClick={e => e.stopPropagation()}>
                {WA_ICON} WhatsApp
              </a>
            )}

            {/* View Concierge — if plan includes concierge */}
            {hasConcierge && (
              <Link href={`/h/${h.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black text-white flex-1 min-w-[120px]"
                style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}>
                <ConciergeBell className="w-3.5 h-3.5" /> View Concierge
              </Link>
            )}

            {/* Digital Check-in — if plan includes checkin */}
            {hasCheckin && (
              <Link href={`/hotels/${h.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black text-white flex-1 min-w-[120px]"
                style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)" }}>
                <Smartphone className="w-3.5 h-3.5" /> Digital Check-in
              </Link>
            )}

            {/* View Detail — always last */}
            <Link href={`/hotels/${h.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black flex-1 min-w-[100px]"
              style={{ background: NAVY, color: GOLD }}>
              View Detail <ChevronRight className="w-3 h-3" />
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
