"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

// ─────────────────────────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; Icon: LucideIcon; color: string; light: string }> = {
  food:         { label: "Food & Drinks",      Icon: Utensils,      color: "#F97316", light: "#FFF7ED" },
  room:         { label: "Room Service",        Icon: BedDouble,     color: "#8B5CF6", light: "#F5F3FF" },
  breakfast:    { label: "Breakfast",           Icon: Coffee,        color: "#D97706", light: "#FFFBEB" },
  bar:          { label: "Bar & Drinks",        Icon: Wine,          color: "#DC2626", light: "#FEF2F2" },
  nightlife:    { label: "Night Life",          Icon: Moon,          color: "#7C3AED", light: "#F5F3FF" },
  massage:      { label: "Massage & Wellness",  Icon: Heart,         color: "#DB2777", light: "#FDF2F8" },
  spa:          { label: "Spa & Beauty",        Icon: FlameKindling, color: "#0891B2", light: "#ECFEFF" },
  gym:          { label: "Gym & Fitness",       Icon: Dumbbell,      color: "#16A34A", light: "#F0FDF4" },
  transport:    { label: "Transport",           Icon: Car,           color: "#2563EB", light: "#EFF6FF" },
  laundry:      { label: "Laundry",             Icon: Shirt,         color: "#0284C7", light: "#F0F9FF" },
  housekeeping: { label: "Housekeeping",        Icon: Home,          color: "#059669", light: "#ECFDF5" },
  concierge:    { label: "Concierge",           Icon: Bell,          color: "#9333EA", light: "#FAF5FF" },
  business:     { label: "Business Services",   Icon: Briefcase,     color: "#374151", light: "#F9FAFB" },
  tour:         { label: "Tours",               Icon: Map,           color: "#3B82F6", light: "#EFF6FF" },
  activity:     { label: "Activities",          Icon: Target,        color: "#10B981", light: "#ECFDF5" },
  other:        { label: "Other",               Icon: Sparkles,      color: "#6B7280", light: "#F9FAFB" },
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
    if (!sheet.name.trim()) { setSheet({ ...sheet, error: "Please enter your name." }); return; }
    setSheet({ ...sheet, submitting: true, error: "" });
    try {
      await bookingsApi.create({
        service_id: sheet.svc.id, guest_name: sheet.name.trim(),
        guest_phone: sheet.phone.trim(), guest_room: sheet.room.trim(),
        quantity: sheet.qty, notes: sheet.notes.trim(), payment_method: sheet.payMethod,
      });
      setSheet({ ...sheet, done: true, submitting: false });
    } catch (e) {
      setSheet({ ...sheet, error: e instanceof Error ? e.message : "Booking failed", submitting: false });
    }
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      <p className="text-base text-slate-400 font-semibold">Loading…</p>
    </div>
  );
  if (notFound || !hotel) return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-sm mb-2">
        <SearchX className="w-12 h-12 text-slate-300" />
      </div>
      <p className="font-black text-slate-800 text-2xl">Hotel Not Found</p>
      <p className="text-slate-400 text-base">This link may be invalid or expired.</p>
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
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse"
            style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <div className="h-44 bg-slate-100 w-full" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-slate-100 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              <div className="h-3 bg-slate-100 rounded-full w-2/3" />
            </div>
            <div className="h-14 bg-slate-50 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // ── Section banner ────────────────────────────────────────────────────────
  function SectionBanner({ icon: Icon, iconBg, iconColor, title, subtitle }: {
    icon: LucideIcon; iconBg: string; iconColor: string; title: string; subtitle: string;
  }) {
    return (
      <div className="bg-white rounded-3xl p-5 flex items-center gap-4 mb-2"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon className="w-7 h-7" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="font-black text-slate-900 text-base">{title}</p>
          <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        </div>
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
      <div className="bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Photo */}
        {place.photo_url ? (
          <div className="relative w-full h-48">
            <Image unoptimized src={place.photo_url} alt={place.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            {place.open_now != null && (
              <span className={`absolute top-3 left-3 text-xs font-black px-3 py-1.5 rounded-xl shadow-lg ${place.open_now ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                {place.open_now ? "Open Now" : "Closed"}
              </span>
            )}
            {priceLabel && (
              <span className="absolute top-3 right-3 text-xs font-black px-3 py-1.5 rounded-xl bg-black/60 text-white">
                {priceLabel}
              </span>
            )}
            {/* Name overlay on photo */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-black text-white text-lg leading-snug drop-shadow-md">{place.name}</p>
              {place.rating != null && (
                <div className="flex items-center gap-1.5 mt-1">
                  <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-4 h-4 flex-shrink-0">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-black text-sm text-white">{place.rating.toFixed(1)}</span>
                  {place.user_ratings_total > 0 && (
                    <span className="text-xs text-white/70">
                      ({place.user_ratings_total > 999
                        ? `${(place.user_ratings_total / 1000).toFixed(1)}k`
                        : place.user_ratings_total})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-28 flex items-center justify-center" style={{ background: accentBg }}>
            <MapPin className="w-10 h-10 opacity-25" style={{ color: accentColor }} />
          </div>
        )}

        {/* Details (only shown when no photo, since name/rating is on the photo) */}
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

        {/* AI description + address */}
        <div className="px-5 pt-3 pb-4">
          {place.ai_description && (
            <p className="text-sm text-slate-500 leading-relaxed italic">{place.ai_description}</p>
          )}
          {place.address && (
            <div className="flex items-center gap-2 mt-2.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
              <p className="text-sm text-slate-400 truncate">{place.address}</p>
            </div>
          )}
        </div>

        {/* Directions button — prominent */}
        <a href={place.maps_link} target="_blank" rel="noopener noreferrer"
          style={{ touchAction: "manipulation", background: accentBg, color: accentColor }}
          className="flex items-center justify-center gap-2.5 py-4 border-t border-slate-100 text-sm font-black active:opacity-75 transition-opacity">
          <Navigation className="w-4 h-4" />
          Get Directions
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 opacity-60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>
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
          <div className="w-32 flex-shrink-0">
            {svc.image_url ? (
              <div className="relative w-full h-full min-h-[120px]">
                <Image unoptimized src={svc.image_url} alt={svc.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full min-h-[120px] flex items-center justify-center"
                style={{ background: m.light }}>
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
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">Cash on delivery</span>
              )}
            </div>
          </div>
        </div>

        {viewOnly ? (
          <button onClick={() => setViewSvc(svc)}
            className="w-full flex items-center justify-center gap-3 py-4 font-black text-base active:opacity-75 transition-opacity border-t"
            style={{ borderColor: m.light, background: m.light, color: m.color, touchAction: "manipulation" }}>
            <Info className="w-5 h-5" />
            View Details
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
            Book Now &nbsp;·&nbsp; £{Number(svc.price).toFixed(2)}
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
    <div className="min-h-screen bg-[#F0F2F5] pb-28"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-8 pb-7 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0D0D1A 0%, #1A1040 30%, #2D1B69 62%, #5B21B6 100%)" }}>

        {/* Glow blobs */}
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 65%)" }} />
        <div className="absolute top-6 right-5 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(109,40,217,0.32) 0%, transparent 65%)" }} />
        <div className="absolute bottom-10 right-24 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(196,181,253,0.12) 0%, transparent 70%)" }} />

        {/* Hotel identity */}
        <div className="relative z-10 flex items-center gap-4">
          {hotel.logo_url ? (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", padding: 2 }} />
              <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={72} height={72}
                className="relative w-[72px] h-[72px] rounded-2xl object-cover border-2 border-amber-400/60 shadow-2xl" />
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-0.5 rounded-2xl opacity-70"
                style={{ background: "linear-gradient(135deg, #F59E0B, #A855F7)" }} />
              <div className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-2xl"
                style={{ background: "linear-gradient(135deg, #2D1B69, #4C1D95)" }}>
                <span className="text-white font-black text-2xl tracking-tight">
                  {hotel.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-amber-300/90 text-[11px] font-black tracking-[0.18em] uppercase">
                Welcome to
              </p>
            </div>
            <p className="text-white font-black text-[26px] leading-tight line-clamp-2 drop-shadow-md">
              {hotel.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-violet-300 flex-shrink-0" />
              <span className="text-violet-200 text-sm font-semibold">{hotel.city}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
          {[
            { n: services.length,                              label: "Services",  accent: "#F59E0B" },
            { n: services.filter(s => s.is_available).length, label: "Available", accent: "#34D399" },
            { n: (hotel.amenities || []).length,               label: "Amenities", accent: "#A78BFA" },
          ].map(({ n, label, accent }) => (
            <button key={label} onClick={() => setTab("info")}
              className="rounded-2xl px-2 py-4 text-center active:scale-95 transition-transform"
              style={{
                touchAction: "manipulation",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(12px)",
              }}>
              <p className="font-black text-3xl leading-none" style={{ color: accent }}>{n}</p>
              <p className="text-violet-200/80 text-[11px] font-bold mt-1.5 tracking-wide">{label}</p>
            </button>
          ))}
        </div>

        {/* Quick-access category pills */}
        {availableCategories.length > 0 && (
          <div className="relative z-10 mt-5 -mx-1 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {availableCategories.map(cat => {
              const m = CAT_META[cat] ?? CAT_META.other;
              const count = services.filter(s => s.category === cat).length;
              return (
                <button key={cat}
                  onClick={() => setTab("info")}
                  className="flex-shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 active:scale-95 transition-transform"
                  style={{
                    touchAction: "manipulation",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(10px)",
                  }}>
                  <m.Icon className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-bold whitespace-nowrap">{m.label}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab Navigation (horizontal scroll) ──────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F0F2F5] pt-4 pb-3"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>
        <div className="flex gap-2 overflow-x-auto px-4 pb-0.5" style={{ scrollbarWidth: "none" }}>
          {([
            { key: "restaurant" as const, label: "Restaurant", Icon: Utensils },
            { key: "parking"    as const, label: "Parking",    Icon: Car      },
            { key: "night"      as const, label: "Night Life", Icon: Moon     },
            { key: "tours"      as const, label: "Tours",      Icon: Map      },
            { key: "places"     as const, label: "Places",     Icon: MapPin   },
            { key: "info"       as const, label: "Hotel Info", Icon: Info     },
          ]).map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  touchAction: "manipulation",
                  background: active
                    ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)"
                    : "white",
                  boxShadow: active
                    ? "0 6px 22px rgba(37,99,235,0.40)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                }}
                className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl transition-all active:scale-[0.96]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  active ? "bg-white/20" : "bg-blue-50"
                }`}>
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-blue-600"}`} />
                </div>
                <span className={`font-black text-[13px] whitespace-nowrap ${active ? "text-white" : "text-slate-700"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ══ RESTAURANT ══════════════════════════════════════════════════ */}
        {tab === "restaurant" && (
          <RestaurantView hotel={hotel} />
        )}

        {/* ══ PARKING ═════════════════════════════════════════════════════ */}
        {tab === "parking" && (
          <>
            <SectionBanner icon={Car} iconBg="#EFF6FF" iconColor="#2563EB"
              title="Nearby Parking Areas"
              subtitle={`Parking options close to ${hotel.city}`} />
            {loadingNearby["parking"] ? <NearbyLoading /> :
             nearbyParking && nearbyParking.length > 0
               ? nearbyParking.map(p => <NearbyCard key={p.place_id} place={p} accentColor="#075985" accentBg="#E0F2FE" />)
               : <EmptyState Icon={Car} title="No nearby parking found" subtitle="Ask reception for parking recommendations" />
            }
          </>
        )}

        {/* ══ NIGHT LIFE ══════════════════════════════════════════════════ */}
        {tab === "night" && (
          <>
            <SectionBanner icon={Moon} iconBg="#F5F3FF" iconColor="#7C3AED"
              title="Night Life & Evening Fun"
              subtitle={`Clubs & bars near ${hotel.city}`} />
            {loadingNearby["nightlife"] ? <NearbyLoading /> :
             nearbyNightlife && nearbyNightlife.length > 0
               ? nearbyNightlife.map(p => <NearbyCard key={p.place_id} place={p} accentColor="#6B21A8" accentBg="#F3E8FF" />)
               : <EmptyState Icon={Moon} title="No nightlife found nearby" subtitle="Ask reception for evening recommendations" />
            }
          </>
        )}

        {/* ══ TOURS ═══════════════════════════════════════════════════════ */}
        {tab === "tours" && (
          <>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={tourQ} onChange={e => setTourQ(e.target.value)} placeholder="Search tours…"
                className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 border-0 outline-none"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }} />
            </div>
            {filteredTours.length === 0 ? (
              <EmptyState Icon={Map} title="No tours available" subtitle="Check back soon for available tours" />
            ) : filteredTours.map(t => (
              <div key={t.id} className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                {t.image_url ? (
                  <div className="relative w-full h-52">
                    <Image unoptimized src={t.image_url} alt={t.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {t.provider && (
                      <span className={`absolute top-3 left-3 text-xs font-black px-3 py-1.5 rounded-xl shadow ${t.provider === "GYG" ? "bg-orange-500" : "bg-blue-600"} text-white`}>
                        {t.provider === "GYG" ? "GetYourGuide" : "Viator"}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <Map className="w-12 h-12 text-white/40" />
                  </div>
                )}
                <div className="p-5">
                  <p className="font-black text-slate-900 text-lg leading-snug">{t.title}</p>
                  {t.description && <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{t.description}</p>}
                  <div className="flex items-center justify-between mt-5">
                    <div>
                      {t.price ? (
                        <div>
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">From</span>
                          <p className="font-black text-2xl text-slate-900">${t.price}</p>
                        </div>
                      ) : (
                        <span className="text-base text-slate-400 font-semibold">Price on request</span>
                      )}
                    </div>
                    {t.affiliate_link && (
                      <a href={t.affiliate_link} target="_blank" rel="noopener noreferrer"
                        style={{ touchAction: "manipulation", boxShadow: "0 6px 16px rgba(37,99,235,0.35)" }}
                        className="bg-blue-600 text-white text-base font-black px-6 py-3.5 rounded-2xl active:scale-95 transition-transform">
                        Book Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ PLACES ══════════════════════════════════════════════════════ */}
        {tab === "places" && (
          <>
            <SectionBanner icon={MapPin} iconBg="#EEF2FF" iconColor="#4338CA"
              title="Top Attractions Nearby"
              subtitle={`Best places to visit near ${hotel.city}`} />
            {loadingNearby["places"] ? <NearbyLoading /> :
             nearbyAttractions && nearbyAttractions.length > 0
               ? nearbyAttractions.map(p => <NearbyCard key={p.place_id} place={p} accentColor="#4338CA" accentBg="#EEF2FF" />)
               : <EmptyState Icon={MapPin} title="No attractions found" subtitle="Ask reception for local recommendations" />
            }
          </>
        )}

        {/* ══ INFO ════════════════════════════════════════════════════════ */}
        {tab === "info" && (
          <>
            {hotel.whatsapp_number && (
              <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                style={{ touchAction: "manipulation", boxShadow: "0 6px 28px rgba(16,185,129,0.28)" }}
                className="flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-3xl px-5 py-5 active:scale-[0.98] transition-transform">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-lg">Chat on WhatsApp</p>
                  <p className="text-emerald-100 text-sm mt-0.5">{hotel.whatsapp_number} · Reception</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-6 h-6 opacity-60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ...(!hotel.is_24_7 ? [
                  { Icon: Clock, label: "Check-in",  val: hotel.check_in_time  || "14:00", color: "#3B82F6", bg: "#EFF6FF" },
                  { Icon: Clock, label: "Check-out", val: hotel.check_out_time || "11:00", color: "#8B5CF6", bg: "#F5F3FF" },
                ] : []),
                { Icon: Clock, label: "Hours", val: (() => {
                    if (hotel.is_24_7) return "24/7 Open";
                    const fmt = (t: string) => { if (!t) return ""; const [h,m] = t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };
                    return `${fmt(hotel.open_time||"09:00")} – ${fmt(hotel.close_time||"22:00")}`;
                  })(), color: "#059669", bg: "#ECFDF5" },
                { Icon: Wifi,  label: "Wi-Fi",      val: hotel.wifi_info || "Ask Reception",                  color: "#10B981", bg: "#D1FAE5" },
                { Icon: Globe, label: "Language",   val: hotel.language_default?.toUpperCase() || "EN",        color: "#F97316", bg: "#FFF7ED" },
                { Icon: Car,   label: "Parking",    val: nearbyParking   ? `${nearbyParking.length} nearby`   : "See Parking tab",   color: "#075985", bg: "#E0F2FE" },
                { Icon: Moon,  label: "Night Life", val: nearbyNightlife ? `${nearbyNightlife.length} nearby` : "See Night Life tab", color: "#6B21A8", bg: "#F3E8FF" },
              ].map(({ Icon, label, val, color, bg }) => (
                <div key={label} className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="font-black text-slate-900 text-base mt-1">{val}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Services & Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map(a => (
                    <span key={a} className="text-sm font-bold px-3.5 py-2 rounded-full bg-blue-50 text-blue-700">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Full hotel services */}
            {services.length > 0 && (
              <div>
                <div className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-black text-slate-800 text-base">Hotel Services</p>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-sm font-bold text-slate-300">{services.length}</span>
                </div>
                <div className="space-y-4">
                  {services.map(svc => <ServiceCard key={svc.id} svc={svc} viewOnly />)}
                </div>
              </div>
            )}

            {/* Location */}
            {hotel.city && (
              <div className="bg-white rounded-3xl p-5 flex items-center gap-4"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="font-black text-slate-900 text-base mt-1">{hotel.city}</p>
                </div>
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-sm text-slate-300 font-semibold">Powered by <span className="font-black text-slate-400">Amica International</span></p>
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
                  <p className="font-black text-slate-900 text-3xl">Booking Confirmed!</p>
                  <p className="text-slate-500 text-base mt-2">Your request has been received.</p>
                </div>
                <div className="w-full bg-white rounded-3xl p-5 text-left" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-4 mb-4">
                    {(() => {
                      const m = CAT_META[sheet.svc.category] ?? CAT_META.other;
                      return <m.Icon className="w-7 h-7" style={{ color: m.color }} />;
                    })()}
                    <div>
                      <p className="font-bold text-slate-900 text-base">{sheet.svc.name}</p>
                      <p className="text-sm text-slate-400 mt-0.5">Qty: {sheet.qty} · Total: <strong>£{(Number(sheet.svc.price)*sheet.qty).toFixed(2)}</strong></p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    {sheet.payMethod === "cod" ? (
                      <div className="flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-orange-500" />
                        <p className="text-base font-semibold text-orange-600">Pay cash when order arrives</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Landmark className="w-6 h-6 text-blue-500" />
                        <p className="text-base font-semibold text-blue-600">Our team will contact you for payment</p>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSheet(null)}
                  className="w-full py-5 rounded-3xl text-white font-black text-lg active:scale-[0.98] transition-transform"
                  style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #2563EB, #3B82F6)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
                  Done
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
                  <p className="font-bold text-slate-800 text-lg">Quantity</p>
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
                  <p className="font-bold text-slate-800 text-base">Your Details</p>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input value={sheet.name}
                      onChange={e => setSheet(s => s ? { ...s, name: e.target.value, error: "" } : s)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">Phone</label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" value={sheet.phone}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, phone: v } : s); }}
                        placeholder="07700 000000"
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">Room No.</label>
                      <input inputMode="numeric" value={sheet.room}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, room: v } : s); }}
                        placeholder="204"
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">Special Requests</label>
                    <textarea value={sheet.notes}
                      onChange={e => setSheet(s => s ? { ...s, notes: e.target.value } : s)}
                      rows={2} placeholder="Any special requests or allergies…"
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-4 text-base font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 resize-none focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-3xl px-5 py-5 mb-3"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-base mb-4">Payment</p>
                  {sheet.svc.category === "food" ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "#FFF7ED", border: "2px solid #F97316" }}>
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-orange-800 text-base">Cash on Delivery</p>
                        <p className="text-orange-500 text-sm mt-0.5">Pay when your food arrives at your room</p>
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
                          <p className="font-black text-slate-800 text-base">Manual Payment</p>
                          <p className="text-slate-400 text-sm mt-0.5">Bank transfer · Pay in person</p>
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
                          <p className="font-black text-slate-500 text-base">Card / Stripe</p>
                          <p className="text-slate-400 text-sm mt-0.5">Online card payment</p>
                        </div>
                        <span className="text-xs font-black bg-slate-200 text-slate-400 px-2.5 py-1 rounded-full">SOON</span>
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
                      Placing order…
                    </>
                  ) : (
                    <>
                      Confirm Order · £{(Number(sheet.svc.price) * sheet.qty).toFixed(2)}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </>
                  )}
                </button>
                <button onClick={() => setSheet(null)} disabled={sheet.submitting}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-4 mt-2 text-slate-400 font-semibold text-base active:opacity-60">
                  Cancel
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
                  <span className="text-base font-bold text-slate-500">Price</span>
                  <span className="font-black text-4xl" style={{ color: m.color }}>
                    £{Number(viewSvc.price).toFixed(2)}
                  </span>
                </div>

                {viewSvc.description && (
                  <div className="bg-white rounded-2xl px-5 py-5"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">About</p>
                    <p className="text-base text-slate-600 leading-relaxed">{viewSvc.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${viewSvc.is_available ? "bg-emerald-400" : "bg-slate-300"}`} />
                  <span className={`text-base font-bold ${viewSvc.is_available ? "text-emerald-700" : "text-slate-400"}`}>
                    {viewSvc.is_available ? "Available now" : "Currently unavailable"}
                  </span>
                </div>

                <p className="text-center text-sm text-slate-400 pb-2">
                  To enquire or book, please contact the hotel reception.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
