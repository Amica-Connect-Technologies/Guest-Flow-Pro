"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Utensils, BedDouble, Coffee, Wine, Moon, Heart, FlameKindling,
  Dumbbell, Car, Shirt, Home, Briefcase, Sparkles,
  Bell, MapPin, Info, SearchX, Clock, Wifi, Globe,
  Banknote, Landmark, CreditCard, Search,
  ShoppingBag, Star, UtensilsCrossed, Map, Target,
  type LucideIcon,
} from "lucide-react";
import {
  hotelsApi, toursApi, placesApi, servicesApi, bookingsApi,
  type Hotel, type Tour, type Place, type HotelService,
} from "@/lib/api";

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

const PLACE_ICON: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed, cafe: Coffee, museum: Landmark,
  attraction: Star, shop: ShoppingBag, parking: Car, nightlife: Moon, other: Sparkles,
};

const PLACE_TYPES = ["all", "restaurant", "cafe", "attraction", "museum", "shop", "parking", "nightlife", "other"];

const placeColors: Record<string, [string, string]> = {
  restaurant: ["#FEF3C7", "#92400E"], museum:    ["#EDE9FE", "#5B21B6"],
  cafe:       ["#FEF9C3", "#78350F"], attraction: ["#DBEAFE", "#1E40AF"],
  shop:       ["#D1FAE5", "#065F46"], parking:    ["#E0F2FE", "#075985"],
  nightlife:  ["#F3E8FF", "#6B21A8"], other:      ["#F1F5F9", "#475569"],
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
  const [places,   setPlaces]   = useState<Place[]>([]);
  const [services, setServices] = useState<HotelService[]>([]);
  const [tab,      setTab]      = useState<"restaurant"|"parking"|"night"|"tours"|"places"|"info">("restaurant");
  const [tourQ,    setTourQ]    = useState("");
  const [placeQ,   setPlaceQ]   = useState("");
  const [placeT,   setPlaceT]   = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sheet,    setSheet]    = useState<Sheet | null>(null);
  const [viewSvc,  setViewSvc]  = useState<HotelService | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const h = await hotelsApi.get(hotelId);
        setHotel(h);
        const [t, p, s] = await Promise.all([
          toursApi.list(h.city), placesApi.list(h.city), servicesApi.list(hotelId),
        ]);
        setTours(t); setPlaces(p); setServices(s);
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
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading…</p>
    </div>
  );
  if (notFound || !hotel) return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-sm mb-2">
        <SearchX className="w-10 h-10 text-slate-300" />
      </div>
      <p className="font-bold text-slate-800 text-xl">Hotel Not Found</p>
      <p className="text-slate-400 text-sm">This link may be invalid or expired.</p>
    </div>
  );

  // ── Filtered data ────────────────────────────────────────────────────────
  const availableCategories = [...new Set(services.map(s => s.category))];

  const filteredTours  = tours.filter(t =>
    t.title.toLowerCase().includes(tourQ.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(tourQ.toLowerCase())
  );
  const filteredPlaces = places.filter(p =>
    (placeT === "all" || p.type === placeT) &&
    p.name.toLowerCase().includes(placeQ.toLowerCase())
  );

  const parkingPlaces = places.filter(p => p.type === "parking");
  const nightPlaces   = places.filter(p => p.type === "nightlife");
  const foodPlaces    = places.filter(p => p.type === "restaurant" || p.type === "cafe");

  // ── Service card ─────────────────────────────────────────────────────────
  function ServiceCard({ svc, viewOnly = false }: { svc: HotelService; viewOnly?: boolean }) {
    const m = CAT_META[svc.category] ?? CAT_META.other;
    return (
      <div className="bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Top: image + info */}
        <div className="flex items-stretch">
          <div className="w-28 flex-shrink-0">
            {svc.image_url ? (
              <div className="relative w-full h-full min-h-[116px]">
                <Image unoptimized src={svc.image_url} alt={svc.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full min-h-[116px] flex items-center justify-center"
                style={{ background: m.light }}>
                <m.Icon className="w-10 h-10" style={{ color: m.color }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 p-4">
            <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ background: m.light, color: m.color }}>
              <m.Icon className="w-2.5 h-2.5" />{m.label}
            </span>
            <p className="font-black text-slate-900 text-base mt-1.5 leading-snug">{svc.name}</p>
            {svc.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{svc.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="font-black text-2xl text-slate-900">£{Number(svc.price).toFixed(2)}</span>
              {svc.category === "food" && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Cash on delivery</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        {viewOnly ? (
          <button onClick={() => setViewSvc(svc)}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 font-black text-sm active:opacity-75 transition-opacity border-t"
            style={{ borderColor: m.light, background: m.light, color: m.color, touchAction: "manipulation" }}>
            <Info className="w-4 h-4" />
            View Details
          </button>
        ) : (
          <button onClick={() => setSheet(mkSheet(svc))}
            className="w-full flex items-center justify-center gap-2.5 py-4 font-black text-[15px] text-white active:opacity-85 transition-opacity"
            style={{
              touchAction: "manipulation",
              background: `linear-gradient(135deg, ${m.color}ee, ${m.color})`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Book Now &nbsp;·&nbsp; £{Number(svc.price).toFixed(2)}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 opacity-70">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-28"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] px-5 pt-6 pb-6 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-blue-400/10 translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-white/5" />

        {/* Hotel identity */}
        <div className="relative z-10 flex items-center gap-4">
          {hotel.logo_url ? (
            <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={64} height={64}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-black text-xl">{hotel.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-blue-200/80 text-xs font-semibold tracking-wider uppercase">Welcome to</p>
            <p className="text-white font-black text-2xl leading-tight line-clamp-2">{hotel.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3 h-3 text-blue-300 flex-shrink-0" />
              <span className="text-blue-200 text-xs font-semibold">{hotel.city}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5 mt-5">
          {[
            { n: services.length, label: "Services", onClick: () => setTab("restaurant") },
            { n: tours.length,    label: "Tours",    onClick: () => setTab("tours")    },
            { n: places.length,   label: "Places",   onClick: () => setTab("places")   },
          ].map(({ n, label, onClick }) => (
            <button key={label} onClick={onClick}
              className="bg-white/12 backdrop-blur-sm rounded-2xl px-2 py-3 text-center border border-white/10 active:scale-95 transition-transform"
              style={{ touchAction: "manipulation" }}>
              <p className="text-white font-black text-2xl leading-none">{n}</p>
              <p className="text-blue-200 text-[11px] font-bold mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Quick-access category pills */}
        {availableCategories.length > 0 && (
          <div className="relative z-10 mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {availableCategories.map(cat => {
              const m = CAT_META[cat] ?? CAT_META.other;
              const count = services.filter(s => s.category === cat).length;
              return (
                <button key={cat}
                  onClick={() => { setTab("info"); }}
                  className="flex-shrink-0 flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-3.5 py-2.5 active:scale-95 transition-transform"
                  style={{ touchAction: "manipulation" }}>
                  <m.Icon className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-bold whitespace-nowrap">{m.label}</span>
                  <span className="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab Grid ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F0F2F5] px-4 pt-3 pb-3"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: "restaurant" as const, label: "Restaurant", Icon: Utensils, sub: `${foodPlaces.length} nearby`  },
            { key: "parking"    as const, label: "Parking",    Icon: Car,      sub: "Nearby areas"                },
            { key: "night"      as const, label: "Night Life",  Icon: Moon,     sub: "Evening fun"                 },
            { key: "tours"      as const, label: "Tours",       Icon: Map,      sub: `${tours.length} available`   },
            { key: "places"     as const, label: "Places",      Icon: MapPin,   sub: `${places.length} nearby`     },
            { key: "info"       as const, label: "Hotel Info",  Icon: Info,     sub: "WiFi · Check-in"             },
          ]).map(({ key, label, Icon, sub }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  touchAction: "manipulation",
                  boxShadow: active ? "0 6px 20px rgba(37,99,235,0.35)" : "0 2px 8px rgba(0,0,0,0.07)",
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-1 transition-all active:scale-[0.95] ${
                  active ? "bg-blue-600" : "bg-white"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  active ? "bg-white/20" : "bg-blue-50"
                }`}>
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-blue-600"}`} />
                </div>
                <p className={`font-black text-[11px] leading-tight text-center ${active ? "text-white" : "text-slate-800"}`}>{label}</p>
                <p className={`text-[9px] font-semibold leading-tight text-center truncate w-full px-1 ${active ? "text-blue-100" : "text-slate-400"}`}>{sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ══ RESTAURANT ══════════════════════════════════════════════════ */}
        {tab === "restaurant" && (
          <>
            <div className="bg-white rounded-3xl p-4 flex items-center gap-4 mb-1"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">Nearby Restaurants & Cafés</p>
                <p className="text-slate-400 text-xs mt-0.5">Food & dining options close to the hotel</p>
              </div>
            </div>
            {foodPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-8 pb-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Utensils className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-black text-xl">Coming Soon</p>
                  <p className="text-orange-100 text-xs font-semibold mt-1">Working on Nearby Restaurant APIs</p>
                </div>
                <div className="px-6 py-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-600">Nearby restaurants & cafés will appear here</p>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-600">Google Maps integration in progress</p>
                  </div>
                  <p className="text-center text-xs text-slate-400 pt-1">Ask reception for dining recommendations</p>
                </div>
              </div>
            ) : foodPlaces.map(p => {
              const [bg, fg] = placeColors[p.type] ?? placeColors.other;
              const PlaceIco = PLACE_ICON[p.type] ?? UtensilsCrossed;
              return (
                <div key={p.id} className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                  <div className="p-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <PlaceIco className="w-5 h-5" style={{ color: fg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-slate-900 text-sm leading-snug">{p.name}</p>
                          <span className="text-[10px] font-bold capitalize px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: bg, color: fg }}>{p.type}</span>
                        </div>
                        {p.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}
                        {p.address && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-300" />
                            <p className="text-xs text-slate-400 truncate">{p.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {p.google_maps_link && (
                    <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer"
                      style={{ touchAction: "manipulation" }}
                      className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 text-xs font-bold text-slate-500 active:bg-slate-50 transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                      Open in Google Maps
                    </a>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ══ PARKING ══════════════════════════════════════════════════════ */}
        {tab === "parking" && (
          <>
            <div className="bg-white rounded-3xl p-4 flex items-center gap-4 mb-1"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">Nearby Parking Areas</p>
                <p className="text-slate-400 text-xs mt-0.5">Parking options close to the hotel</p>
              </div>
            </div>
            {parkingPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 px-6 pt-8 pb-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-black text-xl">Coming Soon</p>
                  <p className="text-blue-100 text-xs font-semibold mt-1">Working on Nearby Parking APIs</p>
                </div>
                <div className="px-6 py-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-600">Nearby parking areas will appear here</p>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-600">Real-time availability integration in progress</p>
                  </div>
                  <p className="text-center text-xs text-slate-400 pt-1">Ask reception for parking recommendations</p>
                </div>
              </div>
            ) : parkingPlaces.map(p => (
              <div key={p.id} className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#E0F2FE" }}>
                      <Car className="w-5 h-5" style={{ color: "#075985" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm leading-snug">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}
                      {p.address && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-300" />
                          <p className="text-xs text-slate-400 truncate">{p.address}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: "#E0F2FE", color: "#075985" }}>Parking</span>
                  </div>
                </div>
                {p.google_maps_link && (
                  <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer"
                    style={{ touchAction: "manipulation" }}
                    className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 text-xs font-bold text-slate-500 active:bg-slate-50 transition-colors">
                    <MapPin className="w-3.5 h-3.5" />
                    Open in Google Maps
                  </a>
                )}
              </div>
            ))}
          </>
        )}

        {/* ══ NIGHT LIFE ═══════════════════════════════════════════════════ */}
        {tab === "night" && (
          <>
            <div className="bg-white rounded-3xl p-4 flex items-center gap-4 mb-1"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Moon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">Night Life & Evening Fun</p>
                <p className="text-slate-400 text-xs mt-0.5">Entertainment & night programmes nearby</p>
              </div>
            </div>
            {nightPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <Moon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No night life listings yet</p>
                <p className="text-xs text-slate-400 mt-1">Ask reception for evening recommendations</p>
              </div>
            ) : nightPlaces.map(p => (
              <div key={p.id} className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#F3E8FF" }}>
                      <Moon className="w-5 h-5" style={{ color: "#6B21A8" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm leading-snug">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}
                      {p.address && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-300" />
                          <p className="text-xs text-slate-400 truncate">{p.address}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: "#F3E8FF", color: "#6B21A8" }}>Night Life</span>
                  </div>
                </div>
                {p.google_maps_link && (
                  <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer"
                    style={{ touchAction: "manipulation" }}
                    className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 text-xs font-bold text-slate-500 active:bg-slate-50 transition-colors">
                    <MapPin className="w-3.5 h-3.5" />
                    Open in Google Maps
                  </a>
                )}
              </div>
            ))}
          </>
        )}

        {/* ══ TOURS ══════════════════════════════════════════════════════ */}
        {tab === "tours" && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={tourQ} onChange={e => setTourQ(e.target.value)} placeholder="Search tours…"
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 border-0 outline-none"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
            </div>
            {filteredTours.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <Map className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No tours available</p>
              </div>
            ) : filteredTours.map(t => (
              <div key={t.id} className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                {t.image_url ? (
                  <div className="relative w-full h-44">
                    <Image unoptimized src={t.image_url} alt={t.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {t.provider && (
                      <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-xl shadow ${t.provider === "GYG" ? "bg-orange-500" : "bg-blue-600"} text-white`}>
                        {t.provider === "GYG" ? "GetYourGuide" : "Viator"}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <Map className="w-10 h-10 text-white/40" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-black text-slate-900 text-base leading-snug">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {t.price ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">From</span>
                          <p className="font-black text-xl text-slate-900">${t.price}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 font-semibold">Price on request</span>
                      )}
                    </div>
                    {t.affiliate_link && (
                      <a href={t.affiliate_link} target="_blank" rel="noopener noreferrer"
                        style={{ touchAction: "manipulation", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
                        className="bg-blue-600 text-white text-sm font-black px-5 py-3 rounded-2xl active:scale-95 transition-transform">
                        Book Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ PLACES ═════════════════════════════════════════════════════ */}
        {tab === "places" && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={placeQ} onChange={e => setPlaceQ(e.target.value)} placeholder="Search places…"
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 border-0 outline-none"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
            </div>

            {/* Type filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
              {PLACE_TYPES.map(pt => {
                const active = placeT === pt;
                const PlaceIco = PLACE_ICON[pt];
                return (
                  <button key={pt} onClick={() => setPlaceT(pt)} style={{ touchAction: "manipulation" }}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full capitalize transition-all border ${active ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>
                    {PlaceIco && <PlaceIco className="w-3.5 h-3.5" />}
                    {pt === "all" ? "All" : pt}
                  </button>
                );
              })}
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No places listed yet</p>
              </div>
            ) : filteredPlaces.map(p => {
              const [bg, fg] = placeColors[p.type] ?? placeColors.other;
              const PlaceIco = PLACE_ICON[p.type] ?? Sparkles;
              return (
                <div key={p.id} className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                  <div className="p-4">
                    <div className="flex items-start gap-3.5">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: bg }}>
                        <PlaceIco className="w-5 h-5" style={{ color: fg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-slate-900 text-sm leading-snug">{p.name}</p>
                          <span className="text-[10px] font-bold capitalize px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: bg, color: fg }}>{p.type}</span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                        )}
                        {p.address && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-300" />
                            <p className="text-xs text-slate-400 truncate">{p.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {p.google_maps_link && (
                    <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer"
                      style={{ touchAction: "manipulation" }}
                      className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 text-xs font-bold text-slate-500 active:bg-slate-50 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      Open in Google Maps
                    </a>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ══ INFO ═══════════════════════════════════════════════════════ */}
        {tab === "info" && (
          <>
            {hotel.whatsapp_number && (
              <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                style={{ touchAction: "manipulation", boxShadow: "0 4px 24px rgba(16,185,129,0.25)" }}
                className="flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-3xl px-5 py-4 active:scale-[0.98] transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-base">Chat on WhatsApp</p>
                  <p className="text-emerald-100 text-xs mt-0.5">{hotel.whatsapp_number} · Reception</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5 opacity-60">
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
                { Icon: Wifi,  label: "WiFi",       val: hotel.wifi_info || "Ask Reception",                  color: "#10B981", bg: "#D1FAE5" },
                { Icon: Globe, label: "Language",   val: hotel.language_default?.toUpperCase() || "EN",        color: "#F97316", bg: "#FFF7ED" },
                { Icon: Car,   label: "Parking",    val: parkingPlaces.length > 0 ? `${parkingPlaces.length} nearby` : "Ask Reception", color: "#075985", bg: "#E0F2FE" },
                { Icon: Moon,  label: "Night Life", val: nightPlaces.length > 0 ? `${nightPlaces.length} spots` : "Ask Reception",      color: "#6B21A8", bg: "#F3E8FF" },
              ].map(({ Icon, label, val, color, bg }) => (
                <div key={label} className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{val}</p>
                </div>
              ))}
            </div>

            {/* Amenities / Benefits */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Services & Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map(a => (
                    <span key={a} className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Full hotel services */}
            {services.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-black text-slate-800 text-sm">Hotel Services</p>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs font-bold text-slate-300">{services.length}</span>
                </div>
                <div className="space-y-3">
                  {services.map(svc => <ServiceCard key={svc.id} svc={svc} viewOnly />)}
                </div>
              </div>
            )}

            {/* Hotel location */}
            {hotel.city && (
              <div className="bg-white rounded-3xl p-4 flex items-center gap-4"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{hotel.city}</p>
                </div>
              </div>
            )}

            <div className="text-center py-3">
              <p className="text-xs text-slate-300 font-semibold">Powered by <span className="font-black text-slate-400">Amica International</span></p>
            </div>
          </>
        )}
      </div>

      {/* ── Booking Sheet ─────────────────────────────────────────────────── */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div ref={sheetRef}
            className="bg-[#F0F2F5] rounded-t-[32px] overflow-hidden"
            style={{ maxHeight: "94vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>

            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#F0F2F5] z-10">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {sheet.done ? (
              <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
                  style={{ boxShadow: "0 8px 32px rgba(16,185,129,0.25)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-black text-slate-900 text-2xl">Booking Confirmed!</p>
                  <p className="text-slate-500 text-sm mt-1">Your request has been received.</p>
                </div>
                <div className="w-full bg-white rounded-3xl p-4 text-left" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const m = CAT_META[sheet.svc.category] ?? CAT_META.other;
                      return <m.Icon className="w-6 h-6" style={{ color: m.color }} />;
                    })()}
                    <div>
                      <p className="font-bold text-slate-900">{sheet.svc.name}</p>
                      <p className="text-xs text-slate-400">Qty: {sheet.qty} · Total: <strong>£{(Number(sheet.svc.price)*sheet.qty).toFixed(2)}</strong></p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    {sheet.payMethod === "cod" ? (
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-orange-500" />
                        <p className="text-sm font-semibold text-orange-600">Pay cash when order arrives</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-blue-500" />
                        <p className="text-sm font-semibold text-blue-600">Our team will contact you for payment</p>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSheet(null)}
                  className="w-full py-4 rounded-3xl text-white font-black text-base active:scale-[0.98] transition-transform"
                  style={{ touchAction: "manipulation", background: "linear-gradient(135deg, #2563EB, #3B82F6)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
                  Done
                </button>
              </div>
            ) : (
              <div className="px-5 pb-6">
                {/* Service header */}
                <div className="bg-white rounded-3xl p-4 mb-4 flex items-center gap-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                    {sheet.svc.image_url ? (
                      <Image unoptimized src={sheet.svc.image_url} alt={sheet.svc.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      (() => {
                        const m = CAT_META[sheet.svc.category] ?? CAT_META.other;
                        return (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: m.light }}>
                            <m.Icon className="w-8 h-8" style={{ color: m.color }} />
                          </div>
                        );
                      })()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-lg leading-tight">{sheet.svc.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5 capitalize">{CAT_META[sheet.svc.category]?.label}</p>
                    <p className="font-black text-2xl mt-1" style={{ color: CAT_META[sheet.svc.category]?.color ?? "#3B82F6" }}>
                      £{(Number(sheet.svc.price) * sheet.qty).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="bg-white rounded-3xl px-5 py-4 mb-3 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-base">Quantity</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSheet(s => s ? { ...s, qty: Math.max(1, s.qty - 1) } : s)}
                      style={{ touchAction: "manipulation" }}
                      className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 font-black text-xl flex items-center justify-center active:scale-90 transition-transform">
                      −
                    </button>
                    <span className="font-black text-xl text-slate-900 w-6 text-center">{sheet.qty}</span>
                    <button onClick={() => setSheet(s => s ? { ...s, qty: s.qty + 1 } : s)}
                      style={{ touchAction: "manipulation", background: CAT_META[sheet.svc.category]?.color ?? "#3B82F6" }}
                      className="w-10 h-10 rounded-2xl text-white font-black text-xl flex items-center justify-center active:scale-90 transition-transform shadow-md">
                      +
                    </button>
                  </div>
                </div>

                {/* Input fields */}
                <div className="bg-white rounded-3xl px-5 py-4 mb-3 space-y-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-sm">Your Details</p>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input value={sheet.name}
                      onChange={e => setSheet(s => s ? { ...s, name: e.target.value, error: "" } : s)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Phone</label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" value={sheet.phone}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, phone: v } : s); }}
                        placeholder="07700 000000"
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Room No.</label>
                      <input inputMode="numeric" value={sheet.room}
                        onChange={e => { const v = e.target.value.replace(/\D/g, ""); setSheet(s => s ? { ...s, room: v } : s); }}
                        placeholder="204"
                        className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 focus:ring-2 focus:ring-blue-200 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Special Requests</label>
                    <textarea value={sheet.notes}
                      onChange={e => setSheet(s => s ? { ...s, notes: e.target.value } : s)}
                      rows={2} placeholder="Any special requests or allergies…"
                      className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 resize-none focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-3xl px-5 py-4 mb-3"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-sm mb-3">Payment</p>
                  {sheet.svc.category === "food" ? (
                    <div className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: "#FFF7ED", border: "2px solid #F97316" }}>
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-orange-800 text-sm">Cash on Delivery</p>
                        <p className="text-orange-500 text-xs mt-0.5">Pay when your food arrives at your room</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => setSheet(s => s ? { ...s, payMethod: "bank_transfer" } : s)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all"
                        style={{
                          touchAction: "manipulation",
                          border: sheet.payMethod === "bank_transfer" ? "2px solid #2563EB" : "2px solid #F1F5F9",
                          background: sheet.payMethod === "bank_transfer" ? "#EFF6FF" : "#F8F9FA",
                        }}>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Landmark className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-slate-800 text-sm">Manual Payment</p>
                          <p className="text-slate-400 text-xs mt-0.5">Bank transfer · Pay in person</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${sheet.payMethod === "bank_transfer" ? "bg-blue-600" : "border-2 border-slate-200"}`}>
                          {sheet.payMethod === "bank_transfer" && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-4 p-3 rounded-2xl opacity-40 cursor-not-allowed"
                        style={{ border: "2px solid #F1F5F9", background: "#F8F9FA" }}>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-slate-500 text-sm">Card / Stripe</p>
                          <p className="text-slate-400 text-xs mt-0.5">Online card payment</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-200 text-slate-400 px-2 py-1 rounded-full">SOON</span>
                      </div>
                    </div>
                  )}
                </div>

                {sheet.error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{sheet.error}</p>
                  </div>
                )}

                <button onClick={confirmBooking} disabled={sheet.submitting}
                  style={{
                    touchAction: "manipulation",
                    background: sheet.submitting ? "#94A3B8" : `linear-gradient(135deg, ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}, ${CAT_META[sheet.svc.category]?.color ?? "#3B82F6"})`,
                    boxShadow: sheet.submitting ? "none" : `0 8px 24px ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}40`,
                  }}
                  className="w-full py-4 rounded-3xl text-white font-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60">
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </>
                  )}
                </button>
                <button onClick={() => setSheet(null)} disabled={sheet.submitting}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-3 mt-2 text-slate-400 font-semibold text-sm active:opacity-60">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Service Detail Sheet (view-only, no booking) ──────────────────── */}
      {viewSvc && (() => {
        const m = CAT_META[viewSvc.category] ?? CAT_META.other;
        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            onClick={() => setViewSvc(null)}>
            <div className="bg-[#F0F2F5] rounded-t-[32px] overflow-hidden max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Image */}
              <div className="relative w-full h-48 mx-0 overflow-hidden">
                {viewSvc.image_url ? (
                  <Image unoptimized src={viewSvc.image_url} alt={viewSvc.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: m.light }}>
                    <m.Icon className="w-20 h-20 opacity-30" style={{ color: m.color }} />
                  </div>
                )}
                {/* Close button */}
                <button onClick={() => setViewSvc(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-5 space-y-4" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
                {/* Category badge + name */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2"
                    style={{ background: m.light, color: m.color }}>
                    <m.Icon className="w-3 h-3" />{m.label}
                  </span>
                  <h2 className="font-black text-slate-900 text-2xl leading-tight">{viewSvc.name}</h2>
                </div>

                {/* Price */}
                <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <span className="text-sm font-bold text-slate-500">Price</span>
                  <span className="font-black text-3xl" style={{ color: m.color }}>
                    £{Number(viewSvc.price).toFixed(2)}
                  </span>
                </div>

                {/* Description */}
                {viewSvc.description && (
                  <div className="bg-white rounded-2xl px-5 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{viewSvc.description}</p>
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${viewSvc.is_available ? "bg-emerald-400" : "bg-slate-300"}`} />
                  <span className={`text-sm font-bold ${viewSvc.is_available ? "text-emerald-700" : "text-slate-400"}`}>
                    {viewSvc.is_available ? "Available now" : "Currently unavailable"}
                  </span>
                </div>

                {/* Contact prompt */}
                <p className="text-center text-xs text-slate-400 pb-2">
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
