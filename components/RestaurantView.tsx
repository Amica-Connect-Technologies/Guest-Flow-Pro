"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Navigation, Phone, Star, SlidersHorizontal, ChevronLeft, X, Utensils, Search } from "lucide-react";
import { placesApi, type Hotel, type NearbyPlace } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import type { Translations } from "@/lib/i18n";

// ── Food categories ───────────────────────────────────────────────────────────
const CATEGORIES_META = [
  { id: "italian",    emoji: "🍝", keyword: "italian restaurant",      color: "#DC2626", bg: "#FEF2F2" },
  { id: "pizza",      emoji: "🍕", keyword: "pizza",                   color: "#EA580C", bg: "#FFF7ED" },
  { id: "halal",      emoji: "☪️", keyword: "halal",                   color: "#16A34A", bg: "#F0FDF4" },
  { id: "turkish",    emoji: "🥙", keyword: "turkish restaurant",      color: "#D97706", bg: "#FFFBEB" },
  { id: "burgers",    emoji: "🍔", keyword: "burger fried chicken",    color: "#F59E0B", bg: "#FEFCE8" },
  { id: "japanese",   emoji: "🍣", keyword: "japanese sushi",          color: "#EC4899", bg: "#FDF2F8" },
  { id: "chinese",    emoji: "🥡", keyword: "chinese restaurant",      color: "#EF4444", bg: "#FEF2F2" },
  { id: "thai",       emoji: "🍜", keyword: "thai restaurant",         color: "#10B981", bg: "#ECFDF5" },
  { id: "steak",      emoji: "🥩", keyword: "steak house grill",       color: "#7C3AED", bg: "#F5F3FF" },
  { id: "vegan",      emoji: "🥗", keyword: "vegetarian vegan",        color: "#22C55E", bg: "#F0FDF4" },
  { id: "cafe",       emoji: "☕", keyword: "cafe breakfast brunch",   color: "#A16207", bg: "#FEFCE8" },
  { id: "finedining", emoji: "🍷", keyword: "fine dining restaurant",  color: "#9333EA", bg: "#FAF5FF" },
  { id: "bars",       emoji: "🍺", keyword: "bar pub",                 color: "#F59E0B", bg: "#FFFBEB" },
  { id: "grocery",    emoji: "🛒", keyword: "supermarket grocery",     color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "desserts",   emoji: "🍨", keyword: "dessert gelato ice cream",color: "#DB2777", bg: "#FDF2F8" },
] as const;

type Category = (typeof CATEGORIES_META)[number] & { label: string };

type Filters = {
  openNow: boolean;
  distance: 500 | 1000 | 2000;
  familyFriendly: boolean;
  takeaway: boolean;
};

const DEFAULT_FILTERS: Filters = { openNow: false, distance: 1000, familyFriendly: false, takeaway: false };

// ── Badge logic ───────────────────────────────────────────────────────────────
function getBadge(place: NearbyPlace, index: number, t: Translations): { label: string; color: string; bg: string } | null {
  if (index === 0 && (place.rating ?? 0) >= 4.2)
    return { label: t.restaurant.recommendedByHotel, color: "#7C3AED", bg: "#F5F3FF" };
  if ((place.rating ?? 0) >= 4.5 && place.user_ratings_total >= 200)
    return { label: t.restaurant.guestFavourite,       color: "#DB2777", bg: "#FDF2F8" };
  if (place.open_now && (place.rating ?? 0) >= 4.0 && place.user_ratings_total >= 100)
    return { label: t.restaurant.mostPopularTonight,  color: "#EA580C", bg: "#FFF7ED" };
  return null;
}

// ── Price label ───────────────────────────────────────────────────────────────
const PRICE = ["Free", "£", "££", "£££", "££££"];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  hotel: Hotel;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RestaurantView({ hotel }: Props) {
  const { t } = useLanguage();
  const CATEGORIES: Category[] = CATEGORIES_META.map(c => ({
    ...c,
    label: t.restaurant.categories[c.id as keyof typeof t.restaurant.categories],
  }));
  const [view,        setView]        = useState<"discovery" | "results">("discovery");
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [results,     setResults]     = useState<NearbyPlace[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [searchQ,     setSearchQ]     = useState("");

  async function loadCategory(cat: Category, overrideFilters?: Filters) {
    const f = overrideFilters ?? filters;
    setSelectedCat(cat);
    setView("results");
    setLoading(true);
    setError("");
    setResults([]);
    setSearchQ("");
    try {
      let kw = cat.keyword;
      if (f.familyFriendly) kw += " family friendly";
      if (f.takeaway)       kw += " takeaway delivery";
      const data = await placesApi.nearby(hotel.id, "restaurant", { keyword: kw, radius: f.distance });
      setResults(data.places);
    } catch {
      setError(t.restaurant.couldNotLoad);
    }
    setLoading(false);
  }

  // Client-side filter: open now + search
  const displayed = results.filter(p => {
    if (filters.openNow && p.open_now !== true) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }
    return true;
  });

  const activeFilterCount = [
    filters.openNow, filters.distance !== 1000,
    filters.familyFriendly, filters.takeaway,
  ].filter(Boolean).length;

  // ── Discovery screen ────────────────────────────────────────────────────────
  if (view === "discovery") {
    return (
      <div className="space-y-5">

        {/* ── Welcome header ── */}
        <div className="relative overflow-hidden rounded-3xl"
          style={{ background: "linear-gradient(145deg, #0B1426 0%, #0f2a4a 50%, #0a3d5c 100%)", boxShadow: "0 8px 32px rgba(11,20,38,0.25)" }}>
          {/* Subtle dots */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.2,
            backgroundImage: "radial-gradient(rgba(103,232,249,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px", pointerEvents: "none" }} />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 65%)" }} />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="mb-5 md:mb-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(103,232,249,0.15)", border: "1px solid rgba(103,232,249,0.25)" }}>
                    <Utensils className="w-4 h-4" style={{ color: "#67e8f9" }} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(103,232,249,0.75)" }}>
                    {t.restaurant.digitalConcierge}
                  </span>
                </div>
                <p className="text-white font-black text-2xl md:text-3xl leading-tight mb-2">
                  {t.restaurant.whatToEat}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {t.restaurant.chooseHint}
                </p>
              </div>

              {/* Trust badges */}
              <div className="flex md:flex-col gap-2.5 md:gap-2 flex-shrink-0">
                {[
                  { icon: "📍", text: "Near Your Hotel" },
                  { icon: "⭐", text: "Google Verified" },
                  { icon: "🔄", text: "Live Results" },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span className="text-sm">{b.icon}</span>
                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(true)}
            style={{
              touchAction: "manipulation",
              background: activeFilterCount > 0 ? "linear-gradient(135deg, #1E40AF, #2563EB)" : "white",
              boxShadow: activeFilterCount > 0 ? "0 4px 16px rgba(37,99,235,0.25)" : "0 2px 10px rgba(0,0,0,0.07)",
            }}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-3 flex-shrink-0 transition-all">
            <SlidersHorizontal className={`w-4 h-4 ${activeFilterCount > 0 ? "text-white" : "text-blue-600"}`} />
            <span className={`font-black text-sm ${activeFilterCount > 0 ? "text-white" : "text-slate-700"}`}>
              {t.restaurant.filterResults}
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
              {filters.openNow && <Chip label={t.restaurant.openNowChip} onRemove={() => setFilters(f => ({ ...f, openNow: false }))} />}
              {filters.distance !== 1000 && <Chip label={t.restaurant.radiusChip.replace("{distance}", String(filters.distance))} onRemove={() => setFilters(f => ({ ...f, distance: 1000 }))} />}
              {filters.familyFriendly && <Chip label={t.restaurant.familyFriendlyChip} onRemove={() => setFilters(f => ({ ...f, familyFriendly: false }))} />}
              {filters.takeaway && <Chip label={t.restaurant.takeawayChip} onRemove={() => setFilters(f => ({ ...f, takeaway: false }))} />}
            </div>
          )}
        </div>

        {/* ── Category grid ── */}
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 px-0.5">
            {t.restaurant.chooseACuisine}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => loadCategory(cat)}
                style={{
                  touchAction: "manipulation",
                  background: "white",
                  border: `1.5px solid ${cat.color}20`,
                  boxShadow: `0 2px 12px rgba(0,0,0,0.06)`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px) scale(1.02)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${cat.color}30`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}55`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}20`;
                }}
                className="rounded-2xl py-5 px-2 flex flex-col items-center justify-center gap-2.5 min-h-[108px]">

                {/* Emoji in colored circle */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}>
                  <span className="text-[26px] leading-none">{cat.emoji}</span>
                </div>

                <span className="font-black text-[11px] text-center leading-tight" style={{ color: cat.color }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters sheet */}
        {showFilters && (
          <FiltersSheet
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>
    );
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Results header card ── */}
      <div className="bg-white rounded-3xl px-4 py-4 md:px-6 md:py-5"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button onClick={() => { setView("discovery"); setResults([]); }}
            style={{ touchAction: "manipulation", background: "#F1F5F9" }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          {/* Cuisine info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: selectedCat?.bg ?? "#F1F5F9" }}>
              <span className="text-2xl leading-none">{selectedCat?.emoji}</span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-lg leading-none">{selectedCat?.label}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">
                  {t.restaurant.near.replace("{city}", hotel.city)}
                </span>
                {!loading && displayed.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-200 flex-shrink-0" />
                    <span className="text-xs font-black" style={{ color: selectedCat?.color ?? "#2563EB" }}>
                      {displayed.length} results
                    </span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-slate-200 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-slate-300">via Google Places</span>
              </div>
            </div>
          </div>

          {/* Filter button */}
          <button onClick={() => setShowFilters(true)}
            style={{ touchAction: "manipulation" }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black flex-shrink-0 transition-all ${
              activeFilterCount > 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t.restaurant.filter}</span>
            {activeFilterCount > 0 && (
              <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Search bar inside the header card */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder={t.restaurant.searchPlaceholder.replace("{category}", selectedCat?.label ?? t.restaurant.restaurantsFallback)}
            className="w-full bg-slate-50 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 border border-slate-100 outline-none focus:border-slate-200 transition-colors"
          />
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.openNow && <Chip label={t.restaurant.openNowChip} onRemove={() => setFilters(f => ({ ...f, openNow: false }))} />}
          {filters.distance !== 1000 && <Chip label={filters.distance === 500 ? "500m" : "2km"} onRemove={() => setFilters(f => ({ ...f, distance: 1000 }))} />}
          {filters.familyFriendly && <Chip label={t.restaurant.familyFriendlyChip} onRemove={() => setFilters(f => ({ ...f, familyFriendly: false }))} />}
          {filters.takeaway && <Chip label={t.restaurant.takeawayChip} onRemove={() => setFilters(f => ({ ...f, takeaway: false }))} />}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse flex flex-col md:flex-row"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div className="h-44 md:h-auto md:w-[220px] md:flex-shrink-0 bg-slate-100" />
              <div className="flex-1 p-5 space-y-3">
                <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-full" />
                <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="flex gap-2 pt-2 mt-2">
                  <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                  <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                  <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
          <p className="font-bold text-red-700 text-base">{error}</p>
          <button onClick={() => selectedCat && loadCategory(selectedCat)}
            className="mt-3 text-sm font-bold text-red-500 underline underline-offset-2">
            {t.restaurant.tryAgain}
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && results.length > 0 && (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <span className="text-5xl">{selectedCat?.emoji}</span>
          <p className="font-black text-slate-700 text-lg mt-4">{t.restaurant.noMatches}</p>
          <p className="text-sm text-slate-400 mt-1">{t.restaurant.tryRemovingFilters}</p>
        </div>
      )}
      {!loading && !error && results.length === 0 && !loading && displayed.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <span className="text-5xl">{selectedCat?.emoji}</span>
          <p className="font-black text-slate-700 text-lg mt-4">{t.restaurant.noResultsFound.replace("{category}", selectedCat?.label ?? "")}</p>
          <p className="text-sm text-slate-400 mt-1">{t.restaurant.askReceptionRecommendations}</p>
        </div>
      )}

      {/* Results */}
      {!loading && displayed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((place, i) => (
            <RestaurantCard key={place.place_id} place={place} index={i} accentColor={selectedCat?.color ?? "#2563EB"} accentBg={selectedCat?.bg ?? "#EFF6FF"} />
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && displayed.length > 0 && (
        <p className="text-center text-xs text-slate-300 font-semibold pt-2 pb-1">
          {t.restaurant.showingResults
            .replace("{count}", String(displayed.length))
            .replace("{city}", hotel.city)}
        </p>
      )}

      {/* Filters sheet */}
      {showFilters && (
        <FiltersSheet
          filters={filters}
          onChange={newF => {
            setFilters(newF);
            if (selectedCat) loadCategory(selectedCat, newF);
          }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button onClick={onRemove}
      style={{ touchAction: "manipulation" }}
      className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full active:opacity-70 transition-opacity">
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────
function RestaurantCard({ place, index, accentColor, accentBg }: {
  place: NearbyPlace; index: number; accentColor: string; accentBg: string;
}) {
  const { t } = useLanguage();
  const badge = getBadge(place, index, t);
  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s ease" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.13)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; }}>

      {/* ── Photo — full width mobile / fixed 220px desktop ── */}
      {place.photo_url ? (
        <div className="relative w-full h-52 md:w-[220px] md:h-auto md:flex-shrink-0">
          <Image unoptimized src={place.photo_url} alt={place.name} fill className="object-cover" />
          {/* Mobile: bottom-up gradient; Desktop: right-facing gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-transparent" />

          {/* Open / price badges — top right */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {place.open_now != null && (
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md ${place.open_now ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                {place.open_now ? t.restaurant.open : t.restaurant.closed}
              </span>
            )}
          </div>

          {/* Trust badge — top left */}
          {badge && (
            <span className="absolute top-3 left-3 text-[11px] font-black px-3 py-1 rounded-xl shadow-md"
              style={{ background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}

          {/* Name + rating overlay — mobile only */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
            <p className="font-black text-white text-lg leading-snug drop-shadow-md">{place.name}</p>
            {place.rating != null && (
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm w-fit px-2.5 py-1 rounded-xl mt-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-black text-sm text-white">{place.rating.toFixed(1)}</span>
                {place.user_ratings_total > 0 && (
                  <span className="text-xs text-white/65">({place.user_ratings_total > 999 ? `${(place.user_ratings_total / 1000).toFixed(1)}k` : place.user_ratings_total})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-32 md:w-[220px] md:h-auto md:flex-shrink-0 flex items-center justify-center relative"
          style={{ background: accentBg }}>
          <span className="text-5xl opacity-25">🍽️</span>
          {badge && (
            <span className="absolute top-3 left-3 text-[11px] font-black px-3 py-1 rounded-xl"
              style={{ background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col p-5">

        {/* Name + rating — desktop (name not in photo overlay) */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-black text-slate-900 text-base md:text-lg leading-snug flex-1">
            {/* Mobile: only show name if no photo (already on photo overlay) */}
            <span className={place.photo_url ? "hidden md:block" : ""}>{place.name}</span>
          </p>
          {place.rating != null && (
            <div className="hidden md:flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-xl flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-black text-sm text-slate-800">{place.rating.toFixed(1)}</span>
              {place.user_ratings_total > 0 && (
                <span className="text-xs text-slate-400">({place.user_ratings_total > 999 ? `${(place.user_ratings_total / 1000).toFixed(1)}k` : place.user_ratings_total})</span>
              )}
            </div>
          )}
        </div>

        {/* AI description */}
        {place.ai_description && (
          <p className="text-sm text-slate-500 leading-relaxed italic mb-3 line-clamp-2">
            &ldquo;{place.ai_description}&rdquo;
          </p>
        )}

        {/* Address */}
        {place.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
            <p className="text-sm text-slate-400 truncate">{place.address}</p>
          </div>
        )}

        {/* Spacer pushes buttons to bottom */}
        <div className="flex-1 min-h-[12px]" />

        {/* ── Action buttons — horizontal row ── */}
        <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100">
          <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
            style={{ touchAction: "manipulation", color: "white", background: accentColor }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-opacity hover:opacity-85">
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            {t.restaurant.directions}
          </a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(place.name + " " + place.address + " phone number")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ touchAction: "manipulation" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-colors">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            {t.restaurant.call}
          </a>
          <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
            style={{ touchAction: "manipulation" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-colors">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {t.restaurant.view}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Filters sheet ─────────────────────────────────────────────────────────────
function FiltersSheet({
  filters, onChange, onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [local, setLocal] = useState<Filters>(filters);

  function apply() {
    onChange(local);
    onClose();
  }

  function reset() {
    setLocal(DEFAULT_FILTERS);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="bg-[#F0F2F5] rounded-t-[32px] overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-5">
          <div>
            <p className="font-black text-slate-900 text-xl">{t.restaurant.filtersSheetTitle}</p>
            <p className="text-slate-400 text-sm mt-0.5">{t.restaurant.customiseSearch}</p>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center"
            style={{ touchAction: "manipulation", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 space-y-4 pb-5">

          {/* Distance */}
          <div className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p className="font-black text-slate-800 text-base mb-4">{t.restaurant.searchRadius}</p>
            <div className="grid grid-cols-3 gap-2">
              {([500, 1000, 2000] as const).map(d => (
                <button key={d} onClick={() => setLocal(f => ({ ...f, distance: d }))}
                  style={{ touchAction: "manipulation", borderColor: local.distance === d ? "#2563EB" : "#E2E8F0" }}
                  className={`py-3 rounded-2xl text-sm font-black border-2 transition-all active:scale-95 ${
                    local.distance === d ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600"
                  }`}>
                  {d === 500 ? "500m" : d === 1000 ? "1 km" : "2 km"}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-3xl p-5 space-y-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p className="font-black text-slate-800 text-base">{t.restaurant.preferences}</p>

            {[
              { key: "openNow"       as const, emoji: "🕐", label: t.restaurant.openNowPrefLabel,       sub: t.restaurant.openNowPrefSub    },
              { key: "familyFriendly"as const, emoji: "👨‍👩‍👧", label: t.restaurant.familyFriendlyLabel, sub: t.restaurant.familyFriendlySub },
              { key: "takeaway"      as const, emoji: "📦", label: t.restaurant.takeawayLabel, sub: t.restaurant.takeawaySub },
            ].map(({ key, emoji, label, sub }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setLocal(f => ({ ...f, [key]: !f[key] }))}
                  style={{ touchAction: "manipulation" }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${local[key] ? "bg-blue-600" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${local[key] ? "translate-x-7" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
          <button onClick={reset}
            style={{ touchAction: "manipulation", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            className="py-4 rounded-2xl bg-white text-slate-700 font-black text-base active:scale-[0.98] transition-transform">
            {t.restaurant.reset}
          </button>
          <button onClick={apply}
            style={{ touchAction: "manipulation", boxShadow: "0 6px 20px rgba(37,99,235,0.3)" }}
            className="py-4 rounded-2xl bg-blue-600 text-white font-black text-base active:scale-[0.98] transition-transform">
            {t.restaurant.applyFilters}
          </button>
        </div>
      </div>
    </div>
  );
}
