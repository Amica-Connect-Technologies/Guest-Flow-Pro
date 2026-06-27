"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { GYG_LOCATION_IDS, useGygImageFallback } from "@/components/ToursView";
import {
  Utensils, BedDouble, Coffee, Wine, Moon, Heart, FlameKindling,
  Dumbbell, Car, Shirt, Home, Briefcase, Sparkles,
  Bell, MapPin, Info, SearchX, Clock, Wifi, Globe,
  Banknote, Landmark, CreditCard, Search,
  Map, Target, Navigation,
  type LucideIcon,
} from "lucide-react";
import {
  hotelsApi, toursApi, placesApi, servicesApi, bookingsApi,
  type Hotel, type Tour, type HotelService, type NearbyPlace,
} from "@/lib/api";
import RestaurantView from "@/components/RestaurantView";
import { useLanguage } from "@/lib/LanguageContext";

// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, { Icon: LucideIcon; color: string; light: string }> = {
  food:         { Icon: Utensils,      color: "#F97316", light: "#FFF7ED" },
  room:         { Icon: BedDouble,     color: "#8B5CF6", light: "#F5F3FF" },
  breakfast:    { Icon: Coffee,        color: "#D97706", light: "#FFFBEB" },
  bar:          { Icon: Wine,          color: "#DC2626", light: "#FEF2F2" },
  nightlife:    { Icon: Moon,          color: "#7C3AED", light: "#F5F3FF" },
  massage:      { Icon: Heart,         color: "#DB2777", light: "#FDF2F8" },
  spa:          { Icon: FlameKindling, color: "#0891B2", light: "#ECFEFF" },
  gym:          { Icon: Dumbbell,      color: "#16A34A", light: "#F0FDF4" },
  transport:    { Icon: Car,           color: "#2563EB", light: "#EFF6FF" },
  laundry:      { Icon: Shirt,         color: "#0284C7", light: "#F0F9FF" },
  housekeeping: { Icon: Home,          color: "#059669", light: "#ECFDF5" },
  concierge:    { Icon: Bell,          color: "#9333EA", light: "#FAF5FF" },
  business:     { Icon: Briefcase,     color: "#374151", light: "#F9FAFB" },
  tour:         { Icon: Map,           color: "#3B82F6", light: "#EFF6FF" },
  activity:     { Icon: Target,        color: "#10B981", light: "#ECFDF5" },
  other:        { Icon: Sparkles,      color: "#6B7280", light: "#F9FAFB" },
};

// ─────────────────────────────────────────────────────────────────────────────
type Sheet = {
  svc: HotelService;
  qty: number;
  name: string; phone: string; room: string; notes: string;
  payMethod: string;
  submitting: boolean; done: boolean; error: string;
};
function mkSheet(svc: HotelService): Sheet {
  return {
    svc, qty: 1, name: "", phone: "", room: "", notes: "",
    payMethod: svc.category === "food" ? "cod" : "bank_transfer",
    submitting: false, done: false, error: "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ConciergeView({ hotelId }: { hotelId: string }) {
  const { t } = useLanguage();
  useGygImageFallback();
  const CAT_META: Record<string, { label: string; Icon: LucideIcon; color: string; light: string }> = Object.fromEntries(
    Object.entries(CAT_ICONS).map(([key, val]) => [
      key,
      { ...val, label: t.concierge.categories[key as keyof typeof t.concierge.categories] ?? key },
    ])
  );
  const [hotel,    setHotel]    = useState<Hotel | null>(null);
  const [tours,    setTours]    = useState<Tour[]>([]);
  const [services, setServices] = useState<HotelService[]>([]);
  const [tab,      setTab]      = useState<"restaurant"|"parking"|"night"|"tours"|"places"|"info">("restaurant");
  const [tourQ,    setTourQ]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sheet,    setSheet]    = useState<Sheet | null>(null);
  const [viewSvc,  setViewSvc]  = useState<HotelService | null>(null);
  const [nearbyFood,        setNearbyFood]        = useState<NearbyPlace[] | null>(null);
  const [nearbyParking,     setNearbyParking]     = useState<NearbyPlace[] | null>(null);
  const [nearbyNightlife,   setNearbyNightlife]   = useState<NearbyPlace[] | null>(null);
  const [nearbyAttractions, setNearbyAttractions] = useState<NearbyPlace[] | null>(null);
  const [loadingNearby,     setLoadingNearby]     = useState<Record<string, boolean>>({});
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const h = await hotelsApi.get(hotelId);
        setHotel(h);
        const [t, s] = await Promise.all([
          toursApi.list(h.city), servicesApi.list(hotelId),
        ]);
        setTours(t); setServices(s);
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [hotelId]);

  useEffect(() => {
    if (!sheet) return;
    const fn = (e: TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node))
        !sheet.submitting && setSheet(null);
    };
    document.addEventListener("touchstart", fn);
    return () => document.removeEventListener("touchstart", fn);
  }, [sheet]);

  useEffect(() => {
    if (!hotel) return;
    const fetchNearby = async (type: string, setter: (d: NearbyPlace[]) => void) => {
      setLoadingNearby(l => ({ ...l, [type]: true }));
      try { const data = await placesApi.nearby(hotel.id, type); setter(data.places); } catch {}
      setLoadingNearby(l => ({ ...l, [type]: false }));
    };
    if (tab === "restaurant" && nearbyFood === null) fetchNearby("restaurant", setNearbyFood);
    else if (tab === "parking"  && nearbyParking    === null) fetchNearby("parking",    setNearbyParking);
    else if (tab === "night"    && nearbyNightlife   === null) fetchNearby("nightlife",  setNearbyNightlife);
    else if (tab === "places"   && nearbyAttractions === null) fetchNearby("places",     setNearbyAttractions);
  }, [tab, hotel, nearbyFood, nearbyParking, nearbyNightlife, nearbyAttractions]); // eslint-disable-line

  async function confirmBooking() {
    if (!sheet) return;
    if (!sheet.name.trim()) { setSheet({ ...sheet, error: t.concierge.pleaseEnterName }); return; }
    setSheet({ ...sheet, submitting: true, error: "" });
    try {
      await bookingsApi.create({
        service_id: sheet.svc.id, guest_name: sheet.name.trim(),
        guest_phone: sheet.phone.trim(), guest_room: sheet.room.trim(),
        quantity: sheet.qty, notes: sheet.notes.trim(), payment_method: sheet.payMethod,
      });
      setSheet({ ...sheet, done: true, submitting: false });
    } catch (e) {
      setSheet({ ...sheet, error: e instanceof Error ? e.message : t.concierge.bookingFailed, submitting: false });
    }
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      <p className="text-base text-slate-400 font-semibold">{t.concierge.loading}</p>
    </div>
  );
  if (notFound || !hotel) return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-sm mb-2">
        <SearchX className="w-12 h-12 text-slate-300" />
      </div>
      <p className="font-black text-slate-800 text-2xl">{t.concierge.hotelNotFound}</p>
      <p className="text-slate-400 text-base">{t.concierge.invalidLink}</p>
    </div>
  );

  // ── Filtered data ────────────────────────────────────────────────────────
  const availableCategories = [...new Set(services.map(s => s.category))];

  const filteredTours = tours.filter(t =>
    t.title.toLowerCase().includes(tourQ.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(tourQ.toLowerCase())
  );

  // ── Nearby skeleton ──────────────────────────────────────────────────────
  function NearbyLoading() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
            <div className="h-44 bg-slate-100 w-full" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-slate-100 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              <div className="h-3 bg-slate-100 rounded-full w-2/3" />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <div className="flex-1 h-10 bg-slate-100 rounded-2xl" />
              <div className="flex-1 h-10 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Section banner ────────────────────────────────────────────────────────
  function SectionBanner({ icon: Icon, iconBg, iconColor, title, subtitle, count }: {
    icon: LucideIcon; iconBg: string; iconColor: string; title: string; subtitle: string; count?: number;
  }) {
    return (
      <div className="rounded-3xl p-5 md:p-6 flex items-center gap-5 mb-4"
        style={{
          background: `linear-gradient(135deg, ${iconBg} 0%, white 100%)`,
          border: `1px solid ${iconColor}22`,
          boxShadow: `0 4px 24px ${iconColor}18`,
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${iconColor}22, ${iconColor}38)`, boxShadow: `0 4px 12px ${iconColor}28` }}>
          <Icon className="w-7 h-7" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-lg leading-none">{title}</p>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        {count != null && count > 0 && (
          <div className="flex-shrink-0 text-center px-4 py-2.5 rounded-2xl"
            style={{ background: `${iconColor}14` }}>
            <p className="font-black text-lg leading-none" style={{ color: iconColor }}>{count}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: `${iconColor}90` }}>found</p>
          </div>
        )}
      </div>
    );
  }

  // ── Google Places card ────────────────────────────────────────────────────
  function NearbyCard({ place, accentColor = "#3B82F6", accentBg = "#EFF6FF" }: {
    place: NearbyPlace; accentColor?: string; accentBg?: string;
  }) {
    const priceLabel = place.price_level != null
      ? (["Free", "£", "££", "£££", "££££"][place.price_level] ?? "") : "";
    return (
      <div className="bg-white rounded-3xl overflow-hidden flex flex-col"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.14)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }}>

        {/* Photo */}
        {place.photo_url ? (
          <div className="relative w-full h-44 flex-shrink-0">
            <Image unoptimized src={place.photo_url} alt={place.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              {place.open_now != null && (
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md ${place.open_now ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {place.open_now ? t.concierge.openNowBadge : t.concierge.closed}
                </span>
              )}
              {priceLabel && (
                <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-black/55 text-white backdrop-blur-sm ml-auto">
                  {priceLabel}
                </span>
              )}
            </div>
            {/* Name + rating overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-black text-white text-base leading-snug drop-shadow-md">{place.name}</p>
              {place.rating != null && (
                <div className="flex items-center gap-1.5 mt-1.5 w-fit px-2.5 py-1 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
                  <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5 flex-shrink-0">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-black text-sm text-white">{place.rating.toFixed(1)}</span>
                  {place.user_ratings_total > 0 && (
                    <span className="text-xs text-white/65">({place.user_ratings_total > 999
                      ? `${(place.user_ratings_total / 1000).toFixed(1)}k`
                      : place.user_ratings_total})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-32 flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
            <MapPin className="w-10 h-10 opacity-20" style={{ color: accentColor }} />
          </div>
        )}

        {/* Details (name + rating when no photo) */}
        {!place.photo_url && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-black text-slate-900 text-base leading-snug flex-1">{place.name}</p>
              {place.rating != null && (
                <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2.5 py-1 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="#F59E0B" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-black text-sm text-slate-700">{place.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="px-5 pt-3 pb-4 flex-1 flex flex-col">
          {place.ai_description && (
            <p className="text-xs text-slate-500 leading-relaxed italic mb-2.5 line-clamp-2">
              &ldquo;{place.ai_description}&rdquo;
            </p>
          )}
          {place.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor, opacity: 0.7 }} />
              <p className="text-xs text-slate-400 truncate">{place.address}</p>
            </div>
          )}
          <div className="flex-1 min-h-[10px]" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-5 pb-5">
          <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
            style={{ touchAction: "manipulation", background: accentColor, color: "white" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black transition-opacity hover:opacity-85">
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            {t.concierge.getDirections}
          </a>
          <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
            style={{ touchAction: "manipulation" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-colors">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            View on Maps
          </a>
        </div>
      </div>
    );
  }

  // ── Service card ─────────────────────────────────────────────────────────
  function ServiceCard({ svc, viewOnly = false }: { svc: HotelService; viewOnly?: boolean }) {
    const m = CAT_META[svc.category] ?? CAT_META.other;
    return (
      <div className="bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        <div className="flex items-stretch">
          <div className="w-32 flex-shrink-0 self-stretch relative overflow-hidden" style={{ minHeight: 130 }}>
            {svc.image_url ? (
              <Image unoptimized src={svc.image_url} alt={svc.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: m.light }}>
                <m.Icon className="w-12 h-12" style={{ color: m.color }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 p-4">
            <span className="text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
              style={{ background: m.light, color: m.color }}>
              <m.Icon className="w-3 h-3" />{m.label}
            </span>
            <p className="font-black text-slate-900 text-lg mt-2 leading-snug">{svc.name}</p>
            {svc.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">{svc.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="font-black text-2xl text-slate-900">£{Number(svc.price).toFixed(2)}</span>
              {svc.category === "food" && (
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">{t.concierge.cashOnDelivery}</span>
              )}
            </div>
          </div>
        </div>

        {viewOnly ? (
          <button onClick={() => setViewSvc(svc)}
            className="w-full flex items-center justify-center gap-3 py-4 font-black text-base active:opacity-75 transition-opacity border-t"
            style={{ borderColor: m.light, background: m.light, color: m.color, touchAction: "manipulation" }}>
            <Info className="w-5 h-5" />
            {t.concierge.viewDetails}
          </button>
        ) : (
          <button onClick={() => setSheet(mkSheet(svc))}
            className="w-full flex items-center justify-center gap-3 py-5 font-black text-base text-white active:opacity-85 transition-opacity"
            style={{
              touchAction: "manipulation",
              background: `linear-gradient(135deg, ${m.color}ee, ${m.color})`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.concierge.bookNow} &nbsp;·&nbsp; £{Number(svc.price).toFixed(2)}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 opacity-70">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  function EmptyState({ Icon, title, subtitle }: { Icon: LucideIcon; title: string; subtitle: string }) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <Icon className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <p className="font-black text-slate-700 text-lg">{title}</p>
        <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#ECEEF3" }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #020B12 0%, #083344 35%, #0A4A5E 65%, #0E7490 100%)" }}>

        {/* Subtle dot texture only — no large glow orbs */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.12,
          backgroundImage: "radial-gradient(rgba(103,232,249,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none" }} />
        {/* Soft bottom fade to blend into page */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(2,11,18,0.3))" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 pt-8 md:pt-10 pb-8 md:pb-10">
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-10">

            {/* ── Left: identity + stats + categories ── */}
            <div className="flex-1 flex flex-col">

              {/* Hotel identity row */}
              <div className="flex items-start gap-4 mb-6">
                {hotel.logo_url ? (
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 rounded-2xl opacity-70"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #06B6D4)" }} />
                    <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={76} height={76}
                      className="relative rounded-2xl object-cover shadow-xl"
                      style={{ width: 76, height: 76 }} />
                  </div>
                ) : (
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 rounded-2xl opacity-70"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #06B6D4)" }} />
                    <div className="relative rounded-2xl flex items-center justify-center shadow-xl"
                      style={{ width: 76, height: 76, background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                      <span className="text-white font-black text-2xl tracking-tight">
                        {hotel.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <p className="text-[10px] font-black tracking-[0.22em] uppercase"
                      style={{ color: "rgba(103,232,249,0.8)" }}>
                      {t.concierge.welcomeTo}
                    </p>
                  </div>
                  <h1 className="text-white font-black leading-none mb-3"
                    style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
                    {hotel.name}
                  </h1>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#67e8f9" }} />
                      <span className="text-sm font-semibold" style={{ color: "rgba(103,232,249,0.85)" }}>{hotel.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2.5} className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-[10px] font-black" style={{ color: "#34d399" }}>Verified Partner</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats — with icons */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { n: services.length,                              label: t.concierge.statsServices,  accent: "#FCD34D", Icon: Bell        },
                  { n: services.filter(s => s.is_available).length, label: t.concierge.statsAvailable, accent: "#6EE7B7", Icon: Sparkles    },
                  { n: (hotel.amenities || []).length,               label: t.concierge.statsAmenities, accent: "#67E8F9", Icon: Briefcase   },
                ].map(({ n, label, accent, Icon: StatIcon }) => (
                  <button key={label} onClick={() => setTab("info")}
                    className="rounded-2xl px-3 py-3 flex items-center gap-2.5 transition-all hover:scale-[1.02]"
                    style={{
                      touchAction: "manipulation",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(103,232,249,0.15)",
                      backdropFilter: "blur(12px)",
                    }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent}20` }}>
                      <StatIcon className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-lg md:text-xl leading-none" style={{ color: accent }}>{n}</p>
                      <p className="text-[9px] font-bold tracking-wide mt-0.5 leading-tight" style={{ color: "rgba(103,232,249,0.55)" }}>{label}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Category pills — icon in colored circle, matches tab style */}
              {availableCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" style={{ scrollbarWidth: "none" }}>
                  {availableCategories.map(cat => {
                    const m = CAT_META[cat] ?? CAT_META.other;
                    const count = services.filter(s => s.category === cat).length;
                    return (
                      <button key={cat} onClick={() => setTab("info")}
                        className="flex-shrink-0 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all hover:scale-105"
                        style={{
                          touchAction: "manipulation",
                          background: "rgba(255,255,255,0.09)",
                          border: "1px solid rgba(103,232,249,0.22)",
                          backdropFilter: "blur(10px)",
                        }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(103,232,249,0.15)" }}>
                          <m.Icon className="w-3.5 h-3.5" style={{ color: "#67e8f9" }} />
                        </div>
                        <span className="text-white text-xs font-bold whitespace-nowrap">{m.label}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(6,182,212,0.35)", color: "white" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hotel description */}
              <div className="mt-5 flex-1">
                <p className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)" }}>
                  {hotel.description?.trim()
                    ? hotel.description
                    : `Welcome to ${hotel.name}. Our dedicated concierge team is here to make your stay in ${hotel.city} as comfortable and memorable as possible. Explore local dining, attractions, and services — all at your fingertips.`
                  }
                </p>
              </div>

              {/* Powered by */}
              <div className="hidden md:flex items-center gap-2 mt-5">
                <div className="h-px flex-1" style={{ background: "rgba(103,232,249,0.1)" }} />
                <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Powered by <strong style={{ color: "rgba(255,255,255,0.4)" }}>Amica International</strong>
                </p>
                <div className="h-px flex-1" style={{ background: "rgba(103,232,249,0.1)" }} />
              </div>
            </div>

            {/* ── Right: info card (desktop only) ── */}
            <div className="hidden md:flex md:w-[300px] md:flex-shrink-0">
              <div className="rounded-3xl overflow-hidden flex flex-col w-full"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(103,232,249,0.16)",
                  backdropFilter: "blur(16px)",
                }}>
                {/* Card header */}
                <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(103,232,249,0.1)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(103,232,249,0.15)" }}>
                      <Info className="w-3.5 h-3.5" style={{ color: "#67e8f9" }} />
                    </div>
                    <p className="text-[11px] font-black tracking-[0.22em] uppercase"
                      style={{ color: "rgba(103,232,249,0.65)" }}>
                      Hotel Information
                    </p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="flex-1 flex flex-col divide-y" style={{ borderColor: "rgba(103,232,249,0.08)" }}>
                  {[
                    { Icon: Clock,  label: "Hours",    val: hotel.is_24_7 ? "Open 24/7" : `${hotel.open_time || "09:00"} – ${hotel.close_time || "22:00"}`, accent: "#6EE7B7" },
                    { Icon: Wifi,   label: "Wi-Fi",    val: hotel.wifi_info || "Ask reception",                          accent: "#67E8F9" },
                    { Icon: MapPin, label: "Location", val: hotel.address ? `${hotel.address}, ${hotel.city}` : hotel.city, accent: "#FCD34D" },
                    { Icon: Globe,  label: "Language", val: hotel.language_default?.toUpperCase() || "EN",               accent: "#F9A8D4" },
                  ].map(({ Icon, label, val, accent }) => (
                    <div key={label} className="flex items-center gap-3.5 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider mb-0.5"
                          style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                        <p className="text-sm font-bold text-white truncate">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WhatsApp CTA */}
                {hotel.whatsapp_number ? (
                  <div className="p-4">
                    <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g,"")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 18px rgba(16,185,129,0.35)" }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat on WhatsApp
                    </a>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Contact via reception</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TAB NAVIGATION
      ══════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 pt-3 pb-3"
        style={{ background: "#ECEEF3", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto px-4 md:px-12 pb-0.5 md:justify-start" style={{ scrollbarWidth: "none" }}>
            {([
              { key: "restaurant" as const, label: t.concierge.tabs.restaurant, Icon: Utensils },
              { key: "parking"    as const, label: t.concierge.tabs.parking,    Icon: Car      },
              { key: "night"      as const, label: t.concierge.tabs.nightLife,  Icon: Moon     },
              { key: "tours"      as const, label: t.concierge.tabs.tours,      Icon: Map      },
              { key: "places"     as const, label: t.concierge.tabs.places,     Icon: MapPin   },
              { key: "info"       as const, label: t.concierge.tabs.hotelInfo,  Icon: Info     },
            ]).map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button key={key} onClick={() => setTab(key)}
                  style={{
                    touchAction: "manipulation",
                    background: active ? "linear-gradient(135deg, #083344 0%, #0E7490 100%)" : "white",
                    boxShadow: active ? "0 6px 22px rgba(14,116,144,0.38)" : "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                  }}
                  className="flex-shrink-0 flex items-center gap-2.5 px-4 md:px-5 py-3 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? "rgba(255,255,255,0.18)" : "#ECFEFF" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? "white" : "#0E7490" }} />
                  </div>
                  <span className="font-black text-[13px] whitespace-nowrap"
                    style={{ color: active ? "white" : "#1E293B" }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-5 space-y-4 md:space-y-5">

        {/* ══ RESTAURANT ══════════════════════════════════════════════════ */}
        {tab === "restaurant" && (
          <RestaurantView hotel={hotel} />
        )}

        {/* ══ PARKING ═════════════════════════════════════════════════════ */}
        {tab === "parking" && (
          <>
            <SectionBanner icon={Car} iconBg="#EFF6FF" iconColor="#2563EB"
              title={t.concierge.parkingTitle}
              subtitle={t.concierge.parkingSubtitle.replace("{city}", hotel.city)}
              count={nearbyParking?.length} />
            {loadingNearby["parking"] ? <NearbyLoading /> :
             nearbyParking && nearbyParking.length > 0
               ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{nearbyParking.map(p => <NearbyCard key={p.place_id} place={p} accentColor="#075985" accentBg="#E0F2FE" />)}</div>
               : <EmptyState Icon={Car} title={t.concierge.noParkingFound} subtitle={t.concierge.askReceptionParking} />
            }
          </>
        )}

        {/* ══ NIGHT LIFE ══════════════════════════════════════════════════ */}
        {tab === "night" && (
          <>
            <SectionBanner icon={Moon} iconBg="#F5F3FF" iconColor="#7C3AED"
              title={t.concierge.nightlifeTitle}
              subtitle={t.concierge.nightlifeSubtitle.replace("{city}", hotel.city)}
              count={nearbyNightlife?.length} />
            {loadingNearby["nightlife"] ? <NearbyLoading /> :
             nearbyNightlife && nearbyNightlife.length > 0
               ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{nearbyNightlife.map(p => <NearbyCard key={p.place_id} place={p} accentColor="#6B21A8" accentBg="#F3E8FF" />)}</div>
               : <EmptyState Icon={Moon} title={t.concierge.noNightlifeFound} subtitle={t.concierge.askReceptionEvening} />
            }
          </>
        )}

        {/* ══ TOURS ═══════════════════════════════════════════════════════ */}
        {tab === "tours" && (
          <>
            <Script async defer
              src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
              data-gyg-partner-id="E1C9YRK"
              strategy="lazyOnload"
            />

            {/* Section header */}
            <SectionBanner icon={Map} iconBg="#EFF6FF" iconColor="#2563EB"
              title={t.concierge.tabs.tours}
              subtitle={`Curated tours & experiences near ${hotel.city} — powered by GetYourGuide`} />

            {/* GYG city widgets — each wrapped in a card */}
            <div className="space-y-4">
              {GYG_LOCATION_IDS.map((locationId) => (
                <div key={locationId} className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 36px rgba(0,0,0,0.13)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; }}>
                  <div
                    data-gyg-href="https://widget.getyourguide.com/default/city.frame"
                    data-gyg-location-id={locationId}
                    data-gyg-locale-code="it-IT"
                    data-gyg-widget="city"
                    data-gyg-partner-id="E1C9YRK"
                  />
                </div>
              ))}
              {/* Attribution */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="h-px flex-1 max-w-[100px] bg-slate-200" />
                <p className="text-[11px] font-semibold text-slate-400">
                  Tours powered by <strong className="text-slate-500">GetYourGuide</strong>
                </p>
                <div className="h-px flex-1 max-w-[100px] bg-slate-200" />
              </div>
            </div>

            {/* Hotel-added tours section */}
            {filteredTours.length > 0 && (
              <>
                {/* Divider */}
                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Also from this hotel
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input value={tourQ} onChange={e => setTourQ(e.target.value)}
                    placeholder={t.concierge.searchToursPlaceholder}
                    className="w-full bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 border-0 outline-none"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }} />
                </div>

                {/* Tour cards — 2-col grid on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTours.map(tour => (
                    <div key={tour.id} className="bg-white rounded-3xl overflow-hidden flex flex-col"
                      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.13)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                      }}>

                      {/* Photo */}
                      {tour.image_url ? (
                        <div className="relative w-full h-44 flex-shrink-0">
                          <Image unoptimized src={tour.image_url} alt={tour.title} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                          {tour.provider && (
                            <span className={`absolute top-3 left-3 text-[11px] font-black px-3 py-1 rounded-xl shadow-md ${tour.provider === "GYG" ? "bg-orange-500" : "bg-blue-600"} text-white`}>
                              {tour.provider === "GYG" ? "GetYourGuide" : "Viator"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-32 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                          <Map className="w-12 h-12 text-white/30" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-black text-slate-900 text-base leading-snug mb-2">{tour.title}</h3>
                        {tour.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">{tour.description}</p>
                        )}
                        <div className="flex-1" />
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div>
                            {tour.price ? (
                              <>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{t.concierge.from}</span>
                                <p className="font-black text-2xl text-slate-900 leading-none mt-0.5">${tour.price}</p>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400 font-semibold">{t.concierge.priceOnRequest}</span>
                            )}
                          </div>
                          {tour.affiliate_link && (
                            <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer"
                              style={{ touchAction: "manipulation", background: "#2563EB", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}
                              className="text-white text-sm font-black px-5 py-3 rounded-2xl hover:opacity-90 transition-opacity">
                              {t.concierge.bookNow} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ══ PLACES ══════════════════════════════════════════════════════ */}
        {tab === "places" && (
          <>
            <SectionBanner icon={MapPin} iconBg="#EEF2FF" iconColor="#4338CA"
              title={t.concierge.placesTitle}
              subtitle={t.concierge.placesSubtitle.replace("{city}", hotel.city)}
              count={nearbyAttractions?.length} />

            {loadingNearby["places"] ? <NearbyLoading /> :
             !nearbyAttractions || nearbyAttractions.length === 0
               ? <EmptyState Icon={MapPin} title={t.concierge.noAttractionsFound} subtitle={t.concierge.askReceptionLocal} />
               : (
                 <>
                   {/* ── Featured top attraction (hero layout) ── */}
                   {(() => {
                     const top = nearbyAttractions[0];
                     const priceLabel = top.price_level != null
                       ? (["Free", "£", "££", "£££", "££££"][top.price_level] ?? "") : "";
                     return (
                       <div className="bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row"
                         style={{ boxShadow: "0 6px 28px rgba(67,56,202,0.13)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                         onMouseEnter={e => {
                           (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                           (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 40px rgba(67,56,202,0.18)";
                         }}
                         onMouseLeave={e => {
                           (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                           (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(67,56,202,0.13)";
                         }}>

                         {/* Photo */}
                         <div className="relative w-full h-56 md:h-auto md:flex-1 flex-shrink-0">
                           {top.photo_url ? (
                             <>
                               <Image unoptimized src={top.photo_url} alt={top.name} fill className="object-cover" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-transparent" />
                             </>
                           ) : (
                             <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center">
                               <MapPin className="w-16 h-16 text-white/20" />
                             </div>
                           )}

                           {/* Badges */}
                           <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                             <div className="flex flex-col gap-1.5">
                               {/* Top attraction badge */}
                               <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-md"
                                 style={{ background: "#4338CA", color: "white" }}>
                                 ⭐ Top Attraction
                               </span>
                               {top.open_now != null && (
                                 <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md ${top.open_now ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                   {top.open_now ? t.concierge.openNowBadge : t.concierge.closed}
                                 </span>
                               )}
                             </div>
                             {priceLabel && (
                               <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-black/55 text-white backdrop-blur-sm">
                                 {priceLabel}
                               </span>
                             )}
                           </div>

                           {/* Mobile name overlay */}
                           <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
                             <p className="font-black text-white text-xl leading-snug drop-shadow-md">{top.name}</p>
                             {top.rating != null && (
                               <div className="flex items-center gap-1.5 mt-1.5 w-fit px-2.5 py-1 rounded-xl"
                                 style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
                                 <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                 <span className="font-black text-sm text-white">{top.rating.toFixed(1)}</span>
                                 {top.user_ratings_total > 0 && <span className="text-xs text-white/65">({top.user_ratings_total > 999 ? `${(top.user_ratings_total/1000).toFixed(1)}k` : top.user_ratings_total})</span>}
                               </div>
                             )}
                           </div>
                         </div>

                         {/* Desktop content panel */}
                         <div className="md:w-[320px] md:flex-shrink-0 p-6 flex flex-col justify-between">
                           <div>
                             <div className="hidden md:flex items-start justify-between gap-3 mb-3">
                               <h2 className="font-black text-slate-900 text-xl leading-snug flex-1">{top.name}</h2>
                               {top.rating != null && (
                                 <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 rounded-xl"
                                   style={{ background: "#EEF2FF" }}>
                                   <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-4 h-4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                   <span className="font-black text-sm" style={{ color: "#4338CA" }}>{top.rating.toFixed(1)}</span>
                                   {top.user_ratings_total > 0 && <span className="text-xs text-slate-400">({top.user_ratings_total > 999 ? `${(top.user_ratings_total/1000).toFixed(1)}k` : top.user_ratings_total})</span>}
                                 </div>
                               )}
                             </div>

                             {top.ai_description && (
                               <p className="text-sm text-slate-500 leading-relaxed italic mb-4 line-clamp-3">
                                 &ldquo;{top.ai_description}&rdquo;
                               </p>
                             )}

                             {top.address && (
                               <div className="flex items-center gap-2 mb-4">
                                 <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#4338CA", opacity: 0.7 }} />
                                 <p className="text-sm text-slate-400 truncate">{top.address}</p>
                               </div>
                             )}

                             {/* Trust strip */}
                             <div className="flex items-center gap-2 flex-wrap mb-4">
                               <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: "#EEF2FF", color: "#4338CA" }}>
                                 📍 Tourist Attraction
                               </span>
                               {top.open_now && (
                                 <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                   ✓ Open Now
                                 </span>
                               )}
                             </div>
                           </div>

                           {/* CTAs */}
                           <div className="flex gap-2">
                             <a href={top.maps_link} target="_blank" rel="noopener noreferrer"
                               style={{ touchAction: "manipulation", background: "#4338CA", color: "white" }}
                               className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black hover:opacity-90 transition-opacity">
                               <Navigation className="w-4 h-4" />
                               {t.concierge.getDirections}
                             </a>
                             <a href={top.maps_link} target="_blank" rel="noopener noreferrer"
                               style={{ touchAction: "manipulation" }}
                               className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 transition-colors">
                               <MapPin className="w-4 h-4" />
                               View on Maps
                             </a>
                           </div>
                         </div>
                       </div>
                     );
                   })()}

                   {/* ── Rest of attractions in 3-col grid ── */}
                   {nearbyAttractions.length > 1 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {nearbyAttractions.slice(1).map(p => (
                         <NearbyCard key={p.place_id} place={p} accentColor="#4338CA" accentBg="#EEF2FF" />
                       ))}
                     </div>
                   )}
                 </>
               )
            }
          </>
        )}

        {/* ══ INFO ════════════════════════════════════════════════════════ */}
        {tab === "info" && (
          <>
            <SectionBanner icon={Info} iconBg="#EFF6FF" iconColor="#2563EB"
              title={t.concierge.tabs.hotelInfo}
              subtitle={`Everything you need to know about ${hotel.name}`} />

            {/* ── Desktop 2-col: main info left, contact/location right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

              {/* LEFT column */}
              <div className="space-y-5">

                {/* Info grid — 3 cols on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ...(!hotel.is_24_7 ? [
                      { Icon: Clock, label: t.concierge.checkIn,  val: hotel.check_in_time  || "14:00", color: "#3B82F6", bg: "#EFF6FF" },
                      { Icon: Clock, label: t.concierge.checkOut, val: hotel.check_out_time || "11:00", color: "#8B5CF6", bg: "#F5F3FF" },
                    ] : []),
                    { Icon: Clock, label: t.concierge.hoursLabel, val: (() => {
                        if (hotel.is_24_7) return t.concierge.hours247;
                        const fmt = (time: string) => { if (!time) return ""; const [h,m] = time.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };
                        return `${fmt(hotel.open_time||"09:00")} – ${fmt(hotel.close_time||"22:00")}`;
                      })(), color: "#059669", bg: "#ECFDF5" },
                    { Icon: Wifi,  label: t.concierge.wifiLabel,     val: hotel.wifi_info || t.concierge.askReception,                  color: "#10B981", bg: "#D1FAE5" },
                    { Icon: Globe, label: t.concierge.languageLabel, val: hotel.language_default?.toUpperCase() || "EN",        color: "#F97316", bg: "#FFF7ED" },
                    { Icon: Car,   label: t.concierge.parkingLabel,    val: nearbyParking   ? t.concierge.nearbyCount.replace("{count}", String(nearbyParking.length))   : t.concierge.seeParkingTab,   color: "#075985", bg: "#E0F2FE" },
                    { Icon: Moon,  label: t.concierge.nightLifeLabel, val: nearbyNightlife ? t.concierge.nearbyCount.replace("{count}", String(nearbyNightlife.length)) : t.concierge.seeNightlifeTab, color: "#6B21A8", bg: "#F3E8FF" },
                  ].map(({ Icon, label, val, color, bg }) => (
                    <div key={label} className="bg-white rounded-3xl p-5 flex flex-col"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
                      }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: `linear-gradient(135deg, ${bg} 0%, white 100%)`, border: `1px solid ${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                      <p className="font-black text-slate-900 text-base leading-snug">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="font-black text-slate-800 text-sm">{t.concierge.servicesAndBenefits}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map(a => (
                        <span key={a} className="text-sm font-bold px-4 py-2 rounded-full"
                          style={{ background: "#EFF6FF", color: "#2563EB" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotel services */}
                {services.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 py-3 mb-1">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="font-black text-slate-800 text-base">{t.concierge.hotelServices}</p>
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-xs font-black text-slate-300 bg-slate-100 px-2.5 py-1 rounded-full">{services.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map(svc => <ServiceCard key={svc.id} svc={svc} viewOnly />)}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT column — contact + location */}
              <div className="space-y-4">

                {/* WhatsApp CTA */}
                {hotel.whatsapp_number && (
                  <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                    style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 6px 28px rgba(16,185,129,0.30)", display: "flex" }}
                    className="items-center gap-4 rounded-3xl px-5 py-5 hover:opacity-95 transition-opacity">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-base leading-snug">{t.concierge.chatOnWhatsapp}</p>
                      <p className="text-emerald-100 text-sm mt-0.5 truncate">{hotel.whatsapp_number} · {t.concierge.receptionLabel}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5 opacity-60 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </a>
                )}

                {/* Location card */}
                {hotel.city && (
                  <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                    {/* Tinted map header */}
                    <div className="px-5 pt-5 pb-4 flex items-center gap-3"
                      style={{ background: "linear-gradient(135deg, #FEF2F2 0%, white 100%)", borderBottom: "1px solid #FEE2E2" }}>
                      <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{t.concierge.locationLabel}</p>
                        <p className="font-black text-slate-900 text-base leading-snug">{hotel.city}</p>
                      </div>
                    </div>
                    {hotel.address && (
                      <div className="px-5 py-4 flex items-start gap-2.5">
                        <Navigation className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-500 leading-relaxed">{hotel.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Powered by */}
                <div className="text-center py-3">
                  <p className="text-xs text-slate-300 font-semibold">
                    {t.concierge.poweredBy}{" "}
                    <span className="font-black text-slate-400">Amica International</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Booking Sheet ─────────────────────────────────────────────────── */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
          <div ref={sheetRef}
            className="bg-[#F0F2F5] rounded-t-[32px] overflow-hidden"
            style={{ maxHeight: "94vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>

            <div className="flex justify-center pt-4 pb-1 sticky top-0 bg-[#F0F2F5] z-10">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {sheet.done ? (
              <div className="px-6 py-8 flex flex-col items-center text-center gap-5">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center"
                  style={{ boxShadow: "0 8px 32px rgba(16,185,129,0.25)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-black text-slate-900 text-3xl">{t.concierge.bookingConfirmed}</p>
                  <p className="text-slate-500 text-base mt-2">{t.concierge.requestReceived}</p>
                </div>
                <div className="w-full bg-white rounded-3xl p-5 text-left" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-4 mb-4">
                    {(() => {
                      const m = CAT_META[sheet.svc.category] ?? CAT_META.other;
                      return <m.Icon className="w-7 h-7" style={{ color: m.color }} />;
                    })()}
                    <div>
                      <p className="font-bold text-slate-900 text-base">{sheet.svc.name}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{t.concierge.qty}: {sheet.qty} · {t.concierge.total}: <strong>£{(Number(sheet.svc.price)*sheet.qty).toFixed(2)}</strong></p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    {sheet.payMethod === "cod" ? (
                      <div className="flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-orange-500" />
                        <p className="text-base font-semibold text-orange-600">{t.concierge.payCashOnArrival}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Landmark className="w-6 h-6 text-blue-500" />
                        <p className="text-base font-semibold text-blue-600">{t.concierge.teamWillContact}</p>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSheet(null)}
                  className="w-full py-5 rounded-3xl text-white font-black text-lg active:scale-[0.98] transition-transform"
                  style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #2563EB, #3B82F6)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
                  {t.concierge.done}
                </button>
              </div>
            ) : (
              <div className="px-5 pb-6">
                {/* Service header */}
                <div className="bg-white rounded-3xl p-5 mb-4 flex items-center gap-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0">
                    {sheet.svc.image_url ? (
                      <Image unoptimized src={sheet.svc.image_url} alt={sheet.svc.name} width={72} height={72} className="w-full h-full object-cover" />
                    ) : (
                      (() => {
                        const m = CAT_META[sheet.svc.category] ?? CAT_META.other;
                        return (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: m.light }}>
                            <m.Icon className="w-9 h-9" style={{ color: m.color }} />
                          </div>
                        );
                      })()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-xl leading-tight">{sheet.svc.name}</p>
                    <p className="text-slate-400 text-sm mt-0.5 capitalize">{CAT_META[sheet.svc.category]?.label}</p>
                    <p className="font-black text-3xl mt-1" style={{ color: CAT_META[sheet.svc.category]?.color ?? "#3B82F6" }}>
                      £{(Number(sheet.svc.price) * sheet.qty).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="bg-white rounded-3xl px-5 py-5 mb-3 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-lg">{t.concierge.quantity}</p>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setSheet(s => s ? { ...s, qty: Math.max(1, s.qty - 1) } : s)}
                      style={{ touchAction: "manipulation" }}
                      className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 font-black text-2xl flex items-center justify-center active:scale-90 transition-transform">
                      −
                    </button>
                    <span className="font-black text-2xl text-slate-900 w-8 text-center">{sheet.qty}</span>
                    <button onClick={() => setSheet(s => s ? { ...s, qty: s.qty + 1 } : s)}
                      style={{ touchAction: "manipulation", background: CAT_META[sheet.svc.category]?.color ?? "#3B82F6" }}
                      className="w-12 h-12 rounded-2xl text-white font-black text-2xl flex items-center justify-center active:scale-90 transition-transform shadow-md">
                      +
                    </button>
                  </div>
                </div>

                {/* Input fields */}
                <div className="bg-white rounded-3xl px-5 py-5 mb-3 space-y-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-base">{t.concierge.yourDetails}</p>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                      {t.concierge.fullName} <span className="text-red-400">*</span>
                    </label>
                    <input value={sheet.name}
                      onChange={e => setSheet(s => s ? { ...s, name: e.target.value, error: "" } : s)}
                      placeholder={t.concierge.fullNamePlaceholder}
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">{t.concierge.phoneLabel}</label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" value={sheet.phone}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, phone: v } : s); }}
                        placeholder={t.concierge.phonePlaceholder}
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">{t.concierge.roomNo}</label>
                      <input inputMode="numeric" value={sheet.room}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, room: v } : s); }}
                        placeholder={t.concierge.roomPlaceholder}
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">{t.concierge.specialRequests}</label>
                    <textarea value={sheet.notes}
                      onChange={e => setSheet(s => s ? { ...s, notes: e.target.value } : s)}
                      rows={2} placeholder={t.concierge.specialRequestsPlaceholder}
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 resize-none focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-3xl px-5 py-5 mb-3"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-base mb-4">{t.concierge.payment}</p>
                  {sheet.svc.category === "food" ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "#FFF7ED", border: "2px solid #F97316" }}>
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-orange-800 text-base">{t.concierge.cashOnDelivery}</p>
                        <p className="text-orange-500 text-sm mt-0.5">{t.concierge.payWhenArrives}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <button onClick={() => setSheet(s => s ? { ...s, payMethod: "bank_transfer" } : s)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                        style={{
                          touchAction: "manipulation",
                          border: sheet.payMethod === "bank_transfer" ? "2px solid #2563EB" : "2px solid #F1F5F9",
                          background: sheet.payMethod === "bank_transfer" ? "#EFF6FF" : "#F8F9FA",
                        }}>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Landmark className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-slate-800 text-base">{t.concierge.manualPayment}</p>
                          <p className="text-slate-400 text-sm mt-0.5">{t.concierge.bankTransferInPerson}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${sheet.payMethod === "bank_transfer" ? "bg-blue-600" : "border-2 border-slate-200"}`}>
                          {sheet.payMethod === "bank_transfer" && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-4 p-4 rounded-2xl opacity-40 cursor-not-allowed"
                        style={{ border: "2px solid #F1F5F9", background: "#F8F9FA" }}>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-slate-500 text-base">{t.concierge.cardStripe}</p>
                          <p className="text-slate-400 text-sm mt-0.5">{t.concierge.onlineCardPayment}</p>
                        </div>
                        <span className="text-xs font-black bg-slate-200 text-slate-400 px-2.5 py-1 rounded-full">{t.concierge.soon}</span>
                      </div>
                    </div>
                  )}
                </div>

                {sheet.error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-base text-red-600 font-medium">{sheet.error}</p>
                  </div>
                )}

                <button onClick={confirmBooking} disabled={sheet.submitting}
                  style={{
                    touchAction: "manipulation",
                    background: sheet.submitting ? "#94A3B8" : `linear-gradient(135deg, ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}, ${CAT_META[sheet.svc.category]?.color ?? "#3B82F6"})`,
                    boxShadow: sheet.submitting ? "none" : `0 8px 28px ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}40`,
                  }}
                  className="w-full py-5 rounded-3xl text-white font-black text-lg flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-60">
                  {sheet.submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t.concierge.placingOrder}
                    </>
                  ) : (
                    <>
                      {t.concierge.confirmOrder} · £{(Number(sheet.svc.price) * sheet.qty).toFixed(2)}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </>
                  )}
                </button>
                <button onClick={() => setSheet(null)} disabled={sheet.submitting}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-4 mt-2 text-slate-400 font-semibold text-base active:opacity-60">
                  {t.concierge.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Service Detail Sheet ──────────────────────────────────────────── */}
      {viewSvc && (() => {
        const m = CAT_META[viewSvc.category] ?? CAT_META.other;
        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
            onClick={() => setViewSvc(null)}>
            <div className="bg-[#F0F2F5] rounded-t-[32px] overflow-hidden max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex justify-center pt-4 pb-1">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              <div className="relative w-full h-52 mx-0 overflow-hidden">
                {viewSvc.image_url ? (
                  <Image unoptimized src={viewSvc.image_url} alt={viewSvc.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: m.light }}>
                    <m.Icon className="w-24 h-24 opacity-25" style={{ color: m.color }} />
                  </div>
                )}
                <button onClick={() => setViewSvc(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-5 space-y-4" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3"
                    style={{ background: m.light, color: m.color }}>
                    <m.Icon className="w-3.5 h-3.5" />{m.label}
                  </span>
                  <h2 className="font-black text-slate-900 text-2xl leading-tight">{viewSvc.name}</h2>
                </div>

                <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <span className="text-base font-bold text-slate-500">{t.concierge.price}</span>
                  <span className="font-black text-4xl" style={{ color: m.color }}>
                    £{Number(viewSvc.price).toFixed(2)}
                  </span>
                </div>

                {viewSvc.description && (
                  <div className="bg-white rounded-2xl px-5 py-5"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.concierge.about}</p>
                    <p className="text-base text-slate-600 leading-relaxed">{viewSvc.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${viewSvc.is_available ? "bg-emerald-400" : "bg-slate-300"}`} />
                  <span className={`text-base font-bold ${viewSvc.is_available ? "text-emerald-700" : "text-slate-400"}`}>
                    {viewSvc.is_available ? t.concierge.availableNow : t.concierge.currentlyUnavailable}
                  </span>
                </div>

                <p className="text-center text-sm text-slate-400 pb-2">
                  {t.concierge.enquireContact}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
