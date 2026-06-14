"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Navigation, Phone, Star, SlidersHorizontal, ChevronLeft, X, Utensils, Search } from "lucide-react";
import { placesApi, type Hotel, type NearbyPlace } from "@/lib/api";

// ── Food categories ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "italian",    emoji: "🍝", label: "Italian",          keyword: "italian restaurant",      color: "#DC2626", bg: "#FEF2F2" },
  { id: "pizza",      emoji: "🍕", label: "Pizzeria",         keyword: "pizza",                   color: "#EA580C", bg: "#FFF7ED" },
  { id: "halal",      emoji: "☪️", label: "Halal Food",       keyword: "halal",                   color: "#16A34A", bg: "#F0FDF4" },
  { id: "turkish",    emoji: "🥙", label: "Turkish",          keyword: "turkish restaurant",      color: "#D97706", bg: "#FFFBEB" },
  { id: "burgers",    emoji: "🍔", label: "Burgers & Chicken",keyword: "burger fried chicken",    color: "#F59E0B", bg: "#FEFCE8" },
  { id: "japanese",   emoji: "🍣", label: "Japanese / Sushi", keyword: "japanese sushi",          color: "#EC4899", bg: "#FDF2F8" },
  { id: "chinese",    emoji: "🥡", label: "Chinese Food",     keyword: "chinese restaurant",      color: "#EF4444", bg: "#FEF2F2" },
  { id: "thai",       emoji: "🍜", label: "Thai Food",        keyword: "thai restaurant",         color: "#10B981", bg: "#ECFDF5" },
  { id: "steak",      emoji: "🥩", label: "Steak House",      keyword: "steak house grill",       color: "#7C3AED", bg: "#F5F3FF" },
  { id: "vegan",      emoji: "🥗", label: "Vegetarian / Vegan",keyword: "vegetarian vegan",      color: "#22C55E", bg: "#F0FDF4" },
  { id: "cafe",       emoji: "☕", label: "Cafés & Breakfast",keyword: "cafe breakfast brunch",   color: "#A16207", bg: "#FEFCE8" },
  { id: "finedining", emoji: "🍷", label: "Fine Dining",      keyword: "fine dining restaurant",  color: "#9333EA", bg: "#FAF5FF" },
  { id: "bars",       emoji: "🍺", label: "Bars & Pubs",      keyword: "bar pub",                 color: "#F59E0B", bg: "#FFFBEB" },
  { id: "grocery",    emoji: "🛒", label: "Grocery & Market", keyword: "supermarket grocery",     color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "desserts",   emoji: "🍨", label: "Desserts & Gelato",keyword: "dessert gelato ice cream",color: "#DB2777", bg: "#FDF2F8" },
] as const;

type Category = typeof CATEGORIES[number];

type Filters = {
  openNow: boolean;
  distance: 500 | 1000 | 2000;
  familyFriendly: boolean;
  takeaway: boolean;
};

const DEFAULT_FILTERS: Filters = { openNow: false, distance: 1000, familyFriendly: false, takeaway: false };

// ── Badge logic ───────────────────────────────────────────────────────────────
function getBadge(place: NearbyPlace, index: number): { label: string; color: string; bg: string } | null {
  if (index === 0 && (place.rating ?? 0) >= 4.2)
    return { label: "⭐ Recommended by Hotel", color: "#7C3AED", bg: "#F5F3FF" };
  if ((place.rating ?? 0) >= 4.5 && place.user_ratings_total >= 200)
    return { label: "❤️ Guest Favourite",       color: "#DB2777", bg: "#FDF2F8" };
  if (place.open_now && (place.rating ?? 0) >= 4.0 && place.user_ratings_total >= 100)
    return { label: "🔥 Most Popular Tonight",  color: "#EA580C", bg: "#FFF7ED" };
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
      const data = await placesApi.nearby(hotel.id, "restaurant", kw, f.distance);
      setResults(data.places);
    } catch {
      setError("Could not load restaurants. Please try again.");
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
      <div className="space-y-4">
        {/* Welcome header */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white"
          style={{
            background: "linear-gradient(140deg, #1A0A00 0%, #7C2D12 40%, #C2410C 75%, #EA580C 100%)",
            boxShadow: "0 12px 40px rgba(194,65,12,0.38)",
          }}>
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(251,146,60,0.28) 0%, transparent 65%)" }} />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 65%)" }} />
          <div className="absolute top-3 right-14 w-14 h-14 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}>
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="text-orange-200/90 text-[11px] font-black uppercase tracking-[0.15em]">
                Digital Concierge
              </span>
            </div>
            <p className="text-white font-black text-2xl leading-tight mb-1.5 drop-shadow-sm">
              What would you like<br/>to eat today?
            </p>
            <p className="text-orange-200/75 text-sm leading-relaxed">
              Choose a cuisine — we&apos;ll find the best spots near your hotel.
            </p>
          </div>
        </div>

        {/* Active filters strip */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filters:</span>
            {filters.openNow && <Chip label="Open Now" onRemove={() => setFilters(f => ({ ...f, openNow: false }))} />}
            {filters.distance !== 1000 && <Chip label={`${filters.distance}m radius`} onRemove={() => setFilters(f => ({ ...f, distance: 1000 }))} />}
            {filters.familyFriendly && <Chip label="Family Friendly" onRemove={() => setFilters(f => ({ ...f, familyFriendly: false }))} />}
            {filters.takeaway && <Chip label="Takeaway" onRemove={() => setFilters(f => ({ ...f, takeaway: false }))} />}
          </div>
        )}

        {/* Filter button */}
        <button onClick={() => setShowFilters(true)}
          style={{
            touchAction: "manipulation",
            boxShadow: activeFilterCount > 0
              ? "0 4px 16px rgba(37,99,235,0.22)"
              : "0 2px 10px rgba(0,0,0,0.06)",
            background: activeFilterCount > 0
              ? "linear-gradient(135deg, #1E40AF, #2563EB)"
              : "white",
          }}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-4 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${activeFilterCount > 0 ? "bg-white/20" : "bg-blue-50"}`}>
              <SlidersHorizontal className={`w-4 h-4 ${activeFilterCount > 0 ? "text-white" : "text-blue-600"}`} />
            </div>
            <span className={`font-black text-sm ${activeFilterCount > 0 ? "text-white" : "text-slate-700"}`}>
              Filter Results
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </div>
          <span className={`text-xs font-semibold ${activeFilterCount > 0 ? "text-blue-200" : "text-slate-400"}`}>
            Tap to customise
          </span>
        </button>

        {/* Category grid */}
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] mb-3.5 px-1">Choose a Cuisine</p>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => loadCategory(cat)}
                style={{
                  touchAction: "manipulation",
                  background: `linear-gradient(145deg, ${cat.color}18, ${cat.color}32)`,
                  boxShadow: `0 4px 18px ${cat.color}28`,
                  border: `1.5px solid ${cat.color}22`,
                }}
                className="rounded-2xl py-5 px-2 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all min-h-[102px]">
                <span className="text-[34px] leading-none">{cat.emoji}</span>
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
    <div className="space-y-3">
      {/* Back bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setView("discovery"); setResults([]); }}
          style={{ touchAction: "manipulation", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}
          className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-base truncate">
            {selectedCat?.emoji} {selectedCat?.label}
          </p>
          <p className="text-xs text-slate-400 font-semibold">Near {hotel.city}</p>
        </div>
        <button onClick={() => setShowFilters(true)}
          style={{
            touchAction: "manipulation",
            boxShadow: activeFilterCount === 0 ? "0 2px 8px rgba(0,0,0,0.07)" : undefined,
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black active:scale-95 transition-transform ${
            activeFilterCount > 0 ? "bg-blue-600 text-white" : "bg-white text-slate-700"
          }`}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {activeFilterCount > 0 && <span className="bg-white/25 text-white font-black px-1.5 py-0.5 rounded-full text-[10px]">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder={`Search ${selectedCat?.label ?? "restaurants"}…`}
          className="w-full bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 border-0 outline-none"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        />
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.openNow && <Chip label="Open Now" onRemove={() => setFilters(f => ({ ...f, openNow: false }))} />}
          {filters.distance !== 1000 && <Chip label={filters.distance === 500 ? "500m" : "2km"} onRemove={() => setFilters(f => ({ ...f, distance: 1000 }))} />}
          {filters.familyFriendly && <Chip label="Family" onRemove={() => setFilters(f => ({ ...f, familyFriendly: false }))} />}
          {filters.takeaway && <Chip label="Takeaway" onRemove={() => setFilters(f => ({ ...f, takeaway: false }))} />}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse"
              style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
              <div className="h-48 bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="h-3 bg-slate-100 rounded-full w-3/4" />
              </div>
              <div className="grid grid-cols-3 gap-px h-14 bg-slate-50" />
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
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && results.length > 0 && (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <span className="text-5xl">{selectedCat?.emoji}</span>
          <p className="font-black text-slate-700 text-lg mt-4">No matches</p>
          <p className="text-sm text-slate-400 mt-1">Try removing some filters</p>
        </div>
      )}
      {!loading && !error && results.length === 0 && !loading && displayed.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <span className="text-5xl">{selectedCat?.emoji}</span>
          <p className="font-black text-slate-700 text-lg mt-4">No {selectedCat?.label} found nearby</p>
          <p className="text-sm text-slate-400 mt-1">Ask reception for recommendations</p>
        </div>
      )}

      {/* Results */}
      {!loading && displayed.map((place, i) => (
        <RestaurantCard key={place.place_id} place={place} index={i} accentColor={selectedCat?.color ?? "#2563EB"} accentBg={selectedCat?.bg ?? "#EFF6FF"} />
      ))}

      {/* Count */}
      {!loading && displayed.length > 0 && (
        <p className="text-center text-xs text-slate-300 font-semibold pt-2 pb-1">
          Showing {displayed.length} restaurant{displayed.length !== 1 ? "s" : ""} near {hotel.city}
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
  const badge = getBadge(place, index);
  const priceLabel = place.price_level != null ? (PRICE[place.price_level] ?? "") : "";

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 28px rgba(0,0,0,0.09)" }}>

      {/* Photo */}
      {place.photo_url ? (
        <div className="relative w-full h-52">
          <Image unoptimized src={place.photo_url} alt={place.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            {badge && (
              <span className="text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              {place.open_now != null && (
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl shadow ${place.open_now ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {place.open_now ? "Open" : "Closed"}
                </span>
              )}
              {priceLabel && (
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-black/60 text-white">
                  {priceLabel}
                </span>
              )}
            </div>
          </div>

          {/* Bottom name + rating on photo */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-black text-white text-xl leading-snug drop-shadow-md">{place.name}</p>
            {place.rating != null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-sm px-2.5 py-1 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-black text-sm text-white">{place.rating.toFixed(1)}</span>
                  {place.user_ratings_total > 0 && (
                    <span className="text-xs text-white/70">
                      ({place.user_ratings_total > 999
                        ? `${(place.user_ratings_total / 1000).toFixed(1)}k`
                        : place.user_ratings_total})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-28 flex items-center justify-center relative" style={{ background: accentBg }}>
          <span className="text-6xl opacity-30">🍽️</span>
          {badge && (
            <span className="absolute top-3 left-3 text-[11px] font-black px-3 py-1.5 rounded-xl"
              style={{ background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
        </div>
      )}

      {/* Details section */}
      <div className="p-5">
        {/* Name (when no photo) */}
        {!place.photo_url && (
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="font-black text-slate-900 text-xl leading-snug flex-1">{place.name}</p>
            {place.rating != null && (
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-xl flex-shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-black text-sm text-slate-800">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* AI description */}
        {place.ai_description && (
          <p className="text-sm text-slate-500 leading-relaxed italic mb-3">
            &ldquo;{place.ai_description}&rdquo;
          </p>
        )}

        {/* Address */}
        {place.address && (
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <p className="text-sm text-slate-400 truncate">{place.address}</p>
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="grid grid-cols-3 border-t border-slate-100">
        {/* Directions */}
        <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
          style={{ touchAction: "manipulation", color: accentColor }}
          className="flex flex-col items-center justify-center gap-1.5 py-4 active:opacity-70 transition-opacity border-r border-slate-100">
          <Navigation className="w-5 h-5" />
          <span className="text-xs font-black">Directions</span>
        </a>

        {/* Call */}
        <a href={`https://www.google.com/search?q=${encodeURIComponent(place.name + " " + place.address + " phone number")}`}
          target="_blank" rel="noopener noreferrer"
          style={{ touchAction: "manipulation" }}
          className="flex flex-col items-center justify-center gap-1.5 py-4 text-slate-500 active:opacity-70 transition-opacity border-r border-slate-100">
          <Phone className="w-5 h-5" />
          <span className="text-xs font-black">Call</span>
        </a>

        {/* View on Maps */}
        <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
          style={{ touchAction: "manipulation" }}
          className="flex flex-col items-center justify-center gap-1.5 py-4 text-slate-500 active:opacity-70 transition-opacity">
          <MapPin className="w-5 h-5" />
          <span className="text-xs font-black">View</span>
        </a>
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
            <p className="font-black text-slate-900 text-xl">Filter Results</p>
            <p className="text-slate-400 text-sm mt-0.5">Customise your restaurant search</p>
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
            <p className="font-black text-slate-800 text-base mb-4">Search Radius</p>
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
            <p className="font-black text-slate-800 text-base">Preferences</p>

            {[
              { key: "openNow"       as const, emoji: "🕐", label: "Open Now",       sub: "Show only open restaurants"    },
              { key: "familyFriendly"as const, emoji: "👨‍👩‍👧", label: "Family Friendly", sub: "Suitable for children"         },
              { key: "takeaway"      as const, emoji: "📦", label: "Takeaway / Delivery", sub: "Offers delivery or collection" },
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
            Reset
          </button>
          <button onClick={apply}
            style={{ touchAction: "manipulation", boxShadow: "0 6px 20px rgba(37,99,235,0.3)" }}
            className="py-4 rounded-2xl bg-blue-600 text-white font-black text-base active:scale-[0.98] transition-transform">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
