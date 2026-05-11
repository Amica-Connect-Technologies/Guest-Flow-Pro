"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  hotelsApi, toursApi, placesApi, servicesApi, bookingsApi,
  type Hotel, type Tour, type Place, type HotelService,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; icon: string; color: string; light: string }> = {
  food:     { label: "Food & Drinks", icon: "🍽️", color: "#F97316", light: "#FFF7ED" },
  room:     { label: "Room Service",  icon: "🛏️", color: "#8B5CF6", light: "#F5F3FF" },
  tour:     { label: "Tours",         icon: "🗺️", color: "#3B82F6", light: "#EFF6FF" },
  activity: { label: "Activities",    icon: "🎯", color: "#10B981", light: "#ECFDF5" },
  other:    { label: "Other",         icon: "✨", color: "#6B7280", light: "#F9FAFB" },
};

const PLACE_TYPES = ["all", "restaurant", "cafe", "attraction", "museum", "shop", "other"];

const placeColors: Record<string, [string, string]> = {
  restaurant: ["#FEF3C7", "#92400E"], museum: ["#EDE9FE", "#5B21B6"],
  cafe:       ["#FEF9C3", "#78350F"], attraction: ["#DBEAFE", "#1E40AF"],
  shop:       ["#D1FAE5", "#065F46"], other: ["#F1F5F9", "#475569"],
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
  const [tab,      setTab]      = useState<"services"|"tours"|"places"|"info">("services");
  const [svcCat,   setSvcCat]   = useState("all");
  const [tourQ,    setTourQ]    = useState("");
  const [placeQ,   setPlaceQ]   = useState("");
  const [placeT,   setPlaceT]   = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sheet,    setSheet]    = useState<Sheet | null>(null);
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

  // close sheet on outside tap
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading…</p>
    </div>
  );
  if (notFound || !hotel) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-sm mb-2">
        <span className="text-4xl">🔍</span>
      </div>
      <p className="font-bold text-slate-800 text-xl">Hotel Not Found</p>
      <p className="text-slate-400 text-sm">This link may be invalid or expired.</p>
    </div>
  );

  const filteredSvcs   = services.filter(s => svcCat === "all" || s.category === svcCat);
  const filteredTours  = tours.filter(t => t.title.toLowerCase().includes(tourQ.toLowerCase()) || (t.description ?? "").toLowerCase().includes(tourQ.toLowerCase()));
  const filteredPlaces = places.filter(p => (placeT === "all" || p.type === placeT) && p.name.toLowerCase().includes(placeQ.toLowerCase()));

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#1A1F3A] via-[#1E3A8A] to-[#2563EB] px-5 pt-14 pb-8 overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex items-center gap-4">
          {hotel.logo_url ? (
            <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={60} height={60}
              className="w-[60px] h-[60px] rounded-2xl object-cover border-2 border-white/30 shadow-lg" />
          ) : (
            <div className="w-[60px] h-[60px] rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">{hotel.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="text-blue-200 text-xs font-semibold tracking-wide uppercase">Welcome to</p>
            <p className="text-white font-black text-2xl leading-tight">{hotel.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-300">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.699-5.079 3.699-9.327 0-4.963-3.92-9-8.75-9s-8.75 4.037-8.75 9c0 4.248 1.755 7.248 3.699 9.327a19.577 19.577 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-200 text-xs font-medium">{hotel.city}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 flex gap-3 mt-5">
          {[
            { n: services.length, label: "Services" },
            { n: tours.length,    label: "Tours"    },
            { n: places.length,   label: "Places"   },
          ].map(({ n, label }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center backdrop-blur-sm border border-white/10">
              <p className="text-white font-black text-lg leading-none">{n}</p>
              <p className="text-blue-200 text-[10px] font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
        <div className="flex px-2">
          {(["services","tours","places","info"] as const).map(t => {
            const labels = { services: "Services", tours: "Tours", places: "Places", info: "Info" };
            const icons  = { services: "🛎️", tours: "🗺️", places: "📍", info: "ℹ️" };
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{ touchAction: "manipulation" }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-all ${active ? "opacity-100" : "opacity-40"}`}>
                <span className="text-base leading-none">{icons[t]}</span>
                <span className={`text-[10px] font-bold ${active ? "text-blue-600" : "text-slate-500"}`}>{labels[t]}</span>
                {active && <span className="absolute bottom-0 inset-x-3 h-0.5 bg-blue-600 rounded-t-full" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ══ SERVICES ═══════════════════════════════════════════════════ */}
        {tab === "services" && (
          <>
            {/* Category pills */}
            {services.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                <button onClick={() => setSvcCat("all")} style={{ touchAction: "manipulation" }}
                  className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${svcCat === "all" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-500 border border-slate-200"}`}>
                  All
                </button>
                {[...new Set(services.map(s => s.category))].map(cat => {
                  const m = CAT_META[cat] ?? CAT_META.other;
                  const active = svcCat === cat;
                  return (
                    <button key={cat} onClick={() => setSvcCat(cat)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all border"
                      style={active
                        ? { touchAction: "manipulation", background: m.color, color: "#fff", borderColor: m.color, boxShadow: `0 4px 12px ${m.color}40` }
                        : { touchAction: "manipulation", background: "#fff", color: "#64748B", borderColor: "#E2E8F0" }}>
                      <span>{m.icon}</span>{m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredSvcs.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">🛎️</p>
                <p className="font-bold text-slate-700">No services available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSvcs.map(svc => {
                  const m = CAT_META[svc.category] ?? CAT_META.other;
                  return (
                    <div key={svc.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100/60"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                      <div className="flex items-center gap-4 p-4">
                        {/* image / icon */}
                        <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden">
                          {svc.image_url ? (
                            <Image unoptimized src={svc.image_url} alt={svc.name} width={80} height={80}
                              className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl"
                              style={{ background: m.light }}>
                              {m.icon}
                            </div>
                          )}
                        </div>
                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: m.light, color: m.color }}>
                            {m.label}
                          </span>
                          <p className="font-bold text-slate-900 text-base mt-1 leading-snug">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{svc.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <span className="font-black text-lg text-slate-900">£{Number(svc.price).toFixed(2)}</span>
                              {svc.category === "food" && (
                                <span className="ml-2 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">COD</span>
                              )}
                            </div>
                            <button onClick={() => setSheet(mkSheet(svc))}
                              className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-2xl active:scale-95 transition-transform"
                              style={{ touchAction: "manipulation", background: m.color, boxShadow: `0 4px 12px ${m.color}40` }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ TOURS ══════════════════════════════════════════════════════ */}
        {tab === "tours" && (
          <>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input value={tourQ} onChange={e => setTourQ(e.target.value)} placeholder="Search tours…"
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-300 border-0 outline-none shadow-sm"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
            </div>
            {filteredTours.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="font-bold text-slate-700">No tours available yet</p>
              </div>
            ) : filteredTours.map(t => (
              <div key={t.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100/60"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                {t.image_url && (
                  <div className="relative w-full h-44">
                    <Image unoptimized src={t.image_url} alt={t.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {t.provider && (
                      <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-xl ${t.provider === "GYG" ? "bg-orange-500" : "bg-blue-600"} text-white`}>
                        {t.provider === "GYG" ? "GetYourGuide" : "Viator"}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <p className="font-bold text-slate-900 text-base">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {t.price ? (
                        <span className="font-black text-lg text-slate-900">from ${t.price}</span>
                      ) : (
                        <span className="text-sm text-slate-400 font-medium">Price on request</span>
                      )}
                    </div>
                    {t.affiliate_link && (
                      <a href={t.affiliate_link} target="_blank" rel="noopener noreferrer"
                        style={{ touchAction: "manipulation" }}
                        className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl active:scale-95 transition-transform shadow-md shadow-blue-200">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input value={placeQ} onChange={e => setPlaceQ(e.target.value)} placeholder="Search places…"
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-300 border-0 outline-none"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {PLACE_TYPES.map(pt => (
                <button key={pt} onClick={() => setPlaceT(pt)} style={{ touchAction: "manipulation" }}
                  className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full capitalize transition-all ${placeT === pt ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-500 border border-slate-200"}`}>
                  {pt}
                </button>
              ))}
            </div>
            {filteredPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">📍</p>
                <p className="font-bold text-slate-700">No places listed yet</p>
              </div>
            ) : filteredPlaces.map(p => {
              const [bg, fg] = placeColors[p.type] ?? placeColors.other;
              return (
                <div key={p.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/60"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <span className="text-sm font-black" style={{ color: fg }}>{p.type.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: bg, color: fg }}>{p.type}</span>
                      </div>
                      {p.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}
                      {p.address && (
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0 text-slate-300">
                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.699-5.079 3.699-9.327 0-4.963-3.92-9-8.75-9s-8.75 4.037-8.75 9c0 4.248 1.755 7.248 3.699 9.327a19.577 19.577 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                          </svg>
                          {p.address}
                        </p>
                      )}
                    </div>
                  </div>
                  {p.google_maps_link && (
                    <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer"
                      style={{ touchAction: "manipulation" }}
                      className="mt-3 flex items-center justify-center gap-2 bg-slate-50 rounded-2xl py-3 text-xs font-bold text-slate-600 active:scale-95 transition-transform">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      Open in Maps
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
                style={{ touchAction: "manipulation", boxShadow: "0 4px 20px rgba(16,185,129,0.2)" }}
                className="flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-3xl px-5 py-4 active:scale-[0.98] transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-base">WhatsApp Reception</p>
                  <p className="text-emerald-100 text-sm mt-0.5">{hotel.whatsapp_number}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5 opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🕑", label: "Check-in",  val: "14:00" },
                { icon: "🕙", label: "Check-out", val: "11:00" },
                { icon: "📶", label: "WiFi",       val: "Ask Reception" },
                { icon: "🌐", label: "Language",   val: hotel.language_default?.toUpperCase() || "EN" },
              ].map(({ icon, label, val }) => (
                <div key={label} className="bg-white rounded-3xl p-4 shadow-sm" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <span className="text-2xl">{icon}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{label}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <div className="text-center py-4">
              <p className="text-xs text-slate-300 font-medium">Powered by <span className="font-bold text-slate-400">Amica International</span></p>
            </div>
          </>
        )}
      </div>

      {/* ── Booking Sheet ─────────────────────────────────────────────────── */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div ref={sheetRef}
            className="bg-[#F8F9FA] rounded-t-[32px] overflow-hidden"
            style={{ maxHeight: "94vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>

            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#F8F9FA] z-10">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {sheet.done ? (
              /* ── Success ── */
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
                    <span className="text-2xl">{CAT_META[sheet.svc.category]?.icon ?? "✨"}</span>
                    <div>
                      <p className="font-bold text-slate-900">{sheet.svc.name}</p>
                      <p className="text-xs text-slate-400">Qty: {sheet.qty} · Total: <strong>£{(Number(sheet.svc.price)*sheet.qty).toFixed(2)}</strong></p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    {sheet.payMethod === "cod" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💵</span>
                        <p className="text-sm font-semibold text-orange-600">Pay cash when order arrives</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏦</span>
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
              /* ── Form ── */
              <div className="px-5 pb-6">
                {/* Service header */}
                <div className="bg-white rounded-3xl p-4 mb-4 flex items-center gap-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                    {sheet.svc.image_url ? (
                      <Image unoptimized src={sheet.svc.image_url} alt={sheet.svc.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl"
                        style={{ background: CAT_META[sheet.svc.category]?.light ?? "#F9FAFB" }}>
                        {CAT_META[sheet.svc.category]?.icon ?? "✨"}
                      </div>
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
                    <input
                      value={sheet.name}
                      onChange={e => setSheet(s => s ? { ...s, name: e.target.value, error: "" } : s)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-[#F8F9FA] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 transition-all focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Phone</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={sheet.phone}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "");
                          setSheet(s => s ? { ...s, phone: v } : s);
                        }}
                        placeholder="07700 000000"
                        className="w-full bg-[#F8F9FA] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 transition-all focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Room No.</label>
                      <input
                        inputMode="numeric"
                        value={sheet.room}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "");
                          setSheet(s => s ? { ...s, room: v } : s);
                        }}
                        placeholder="204"
                        className="w-full bg-[#F8F9FA] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 transition-all focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Special Requests</label>
                    <textarea
                      value={sheet.notes}
                      onChange={e => setSheet(s => s ? { ...s, notes: e.target.value } : s)}
                      rows={2}
                      placeholder="Any special requests or allergies…"
                      className="w-full bg-[#F8F9FA] rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none border-0 resize-none transition-all focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-3xl px-5 py-4 mb-3"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <p className="font-bold text-slate-800 text-sm mb-3">Payment</p>

                  {sheet.svc.category === "food" ? (
                    <div className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: "#FFF7ED", border: "2px solid #F97316" }}>
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">💵</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-orange-800 text-sm">Cash on Delivery</p>
                        <p className="text-orange-500 text-xs mt-0.5">Pay when your food arrives at your room</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Manual */}
                      <button onClick={() => setSheet(s => s ? { ...s, payMethod: "bank_transfer" } : s)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all"
                        style={{
                          touchAction: "manipulation",
                          border: sheet.payMethod === "bank_transfer" ? "2px solid #2563EB" : "2px solid #F1F5F9",
                          background: sheet.payMethod === "bank_transfer" ? "#EFF6FF" : "#F8F9FA",
                        }}>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🏦</span>
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

                      {/* Stripe – coming soon */}
                      <div className="flex items-center gap-4 p-3 rounded-2xl opacity-40 cursor-not-allowed"
                        style={{ border: "2px solid #F1F5F9", background: "#F8F9FA" }}>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">💳</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-slate-500 text-sm">Card / Stripe</p>
                          <p className="text-slate-400 text-xs mt-0.5">Online card payment</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-200 text-slate-400 px-2 py-1 rounded-full flex-shrink-0">SOON</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {sheet.error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{sheet.error}</p>
                  </div>
                )}

                {/* CTA */}
                <button onClick={confirmBooking} disabled={sheet.submitting}
                  style={{ touchAction: "manipulation",
                    background: sheet.submitting ? "#94A3B8" : `linear-gradient(135deg, ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}, ${CAT_META[sheet.svc.category]?.color ?? "#3B82F6"})`,
                    boxShadow: sheet.submitting ? "none" : `0 8px 24px ${CAT_META[sheet.svc.category]?.color ?? "#2563EB"}40`
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
    </div>
  );
}
