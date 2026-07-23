"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { hotelsApi, toursApi, type Hotel, type Tour } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

function currency(country: string) {
  return country === "United Kingdom" ? "£" : "€";
}

const PLAN_HAS_CONCIERGE = (p: string) =>
  ["concierge", "concierge_checkin", "full", "starter", "basic", "pro"].includes(p);
const PLAN_HAS_CHECKIN = (p: string) =>
  ["checkin", "concierge_checkin", "full", "starter", "basic", "pro"].includes(p);

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "📶", "Parking": "🅿️", "Pool": "🏊", "Spa": "💆",
  "Gym": "🏋️", "Restaurant": "🍽️", "Bar": "🍸", "Room Service": "🛎️",
  "Airport Shuttle": "🚐", "Concierge": "🔔", "Laundry": "👔",
  "Pet Friendly": "🐾", "Air Conditioning": "❄️", "Sea View": "🌊",
  "City View": "🏙️", "Garden": "🌿", "Terrace": "🏡", "Business Center": "💼",
};

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const IcoMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const IcoWA = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IcoChevRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
const IcoPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);
const IcoImages = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
const IcoGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
  </svg>
);
const IcoStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [tours, setTours]   = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const h = await hotelsApi.get(id);
        setHotel(h);
        const t = await toursApi.list(h.city);
        setTours(t.slice(0, 6));
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-100 border-t-cyan-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading</p>
      </div>
    </div>
  );

  if (notFound || !hotel) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
      <span className="text-6xl">🏨</span>
      <p className="text-lg font-black text-slate-700">Hotel not found</p>
      <button onClick={() => router.push("/hotels")} className="text-sm font-bold text-cyan-700 hover:underline">← Back to Hotels</button>
    </div>
  );

  const photos = (hotel.gallery_images ?? []).map(g => g.image_url).filter(Boolean);
  const curr = currency(hotel.country || "Italy");
  const hasConcierge = PLAN_HAS_CONCIERGE(hotel.plan);
  const hasCheckin   = PLAN_HAS_CHECKIN(hotel.plan);

  const waHref = hotel.whatsapp_number
    ? `https://wa.me/${hotel.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I'd like to book a room at ${hotel.name}`)}`
    : null;

  const CARD_SHADOW = "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.16)";

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#F1F5F9 100%)" }} className="min-h-screen">

      {/* ── BREADCRUMB ─────────────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-[72px] z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-2 text-sm">
          <button onClick={() => router.push("/hotels")}
            className="text-cyan-700 font-semibold hover:text-cyan-800 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Hotels
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-600 truncate">{hotel.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-36 lg:pb-14">

        {/* ── GALLERY GRID ───────────────────────────────────── */}
        {photos.length > 0 ? (
          <div className="relative grid gap-1.5 rounded-[26px] overflow-hidden h-[240px] md:h-[440px] ring-1 ring-slate-900/5"
            style={{ gridTemplateColumns: photos.length === 1 ? "1fr" : "2fr 1fr", gridTemplateRows: "1fr" }}>

            {/* Main photo */}
            <div className="relative cursor-pointer group overflow-hidden"
              onClick={() => setLightbox(0)}>
              <Image unoptimized src={photos[0]} alt={hotel.name} fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {/* Side thumbnails */}
            {photos.length >= 2 && (
              <div className="grid gap-1.5 h-full" style={{ gridTemplateRows: photos.length >= 3 ? "1fr 1fr" : "1fr" }}>
                {photos.slice(1, 3).map((src, i) => (
                  <div key={i} className="relative cursor-pointer group overflow-hidden"
                    onClick={() => setLightbox(i + 1)}>
                    <Image unoptimized src={src} alt="" fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* View all photos pill */}
            {photos.length > 1 && (
              <button onClick={() => setLightbox(0)}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white/90 backdrop-blur px-3.5 py-2 rounded-full shadow-lg hover:bg-white transition-colors">
                <IcoImages />
                View all {photos.length} photos
              </button>
            )}

            {/* Verified ribbon */}
            {hotel.is_verified && (
              <span className="absolute top-4 left-4 flex items-center gap-1 text-[11px] font-black bg-white/95 backdrop-blur text-emerald-700 px-3 py-1.5 rounded-full shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.49 4.49 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.49 4.49 0 01-1.307 3.497 4.49 4.49 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Verified property
              </span>
            )}
          </div>
        ) : (
          <div className="relative rounded-[26px] overflow-hidden h-[220px] md:h-[360px] flex items-center justify-center ring-1 ring-slate-900/5"
            style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
            <span className="relative text-4xl font-black text-white/25 tracking-widest">{hotel.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* ── IDENTITY STRIP (overlaps hero) ─────────────────── */}
        <div className="relative -mt-10 md:-mt-12 mx-2 md:mx-4 mb-6 bg-white rounded-3xl px-5 md:px-7 pt-5 pb-6"
          style={{ boxShadow: CARD_SHADOW }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {hotel.logo_url ? (
              <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={76} height={76}
                className="w-[76px] h-[76px] -mt-14 md:-mt-16 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white shadow-lg bg-white" />
            ) : (
              <div className="w-[76px] h-[76px] -mt-14 md:-mt-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 ring-4 ring-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                {hotel.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl md:text-[28px] font-bold text-slate-900 leading-tight tracking-tight">{hotel.name}</h1>
              <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                <IcoPin />
                <span className="text-sm font-semibold">{hotel.city}{hotel.country ? `, ${hotel.country}` : ""}</span>
              </div>
              {hotel.address && <p className="text-xs text-slate-400 mt-1 truncate">{hotel.address}</p>}
            </div>
            {(hotel.tripadvisor_url || hotel.google_review_url || hotel.website) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {hotel.website && (
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-full px-3 py-1.5 transition-colors">
                    <IcoGlobe /> Website
                  </a>
                )}
                {(hotel.tripadvisor_url || hotel.google_review_url) && (
                  <a href={hotel.tripadvisor_url || hotel.google_review_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-full px-3 py-1.5 transition-colors">
                    <IcoStar /> Reviews
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick stats — understated single-tone row */}
          <div className="flex items-stretch divide-x divide-slate-100 border-t border-slate-100 mt-5 pt-5">
            {[
              {
                label: "Check-in", val: hotel.check_in_time || "14:00",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
              },
              {
                label: "Check-out", val: hotel.check_out_time || "11:00",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
              },
              {
                label: "Hours", val: hotel.is_24_7 ? "Open 24/7" : `${hotel.open_time || "09:00"} – ${hotel.close_time || "22:00"}`,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
            ].map(({ label, val, icon }) => (
              <div key={label} className="flex-1 flex items-center gap-3 px-1 first:pl-0 last:pr-0 sm:px-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-50 text-cyan-700 ring-1 ring-slate-100">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-[13px] md:text-sm font-bold text-slate-800 truncate">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* LEFT */}
          <div className="space-y-5">

            {/* Description */}
            {hotel.description && (
              <div className="bg-white rounded-3xl p-6 md:p-7" style={{ boxShadow: CARD_SHADOW }}>
                <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2.5">
                  <span className="w-6 h-[3px] rounded-full inline-block" style={{ background: "linear-gradient(90deg,#0891B2,#0E7490)" }} />
                  About this property
                </h2>
                <p className="text-[15px] text-slate-600 leading-relaxed">{hotel.description}</p>
              </div>
            )}

            {/* Amenities */}
            {(hotel.amenities?.length ?? 0) > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-7" style={{ boxShadow: CARD_SHADOW }}>
                <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2.5">
                  <span className="w-6 h-[3px] rounded-full inline-block" style={{ background: "linear-gradient(90deg,#0891B2,#0E7490)" }} />
                  Facilities & Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {hotel.amenities!.map(a => (
                    <div key={a} className="flex items-center gap-3 rounded-2xl px-3.5 py-3 border border-slate-100 hover:border-cyan-100 hover:bg-cyan-50/30 transition-colors">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-slate-50 ring-1 ring-slate-100">
                        {AMENITY_ICONS[a] ?? "✓"}
                      </span>
                      <span className="text-[13px] font-semibold text-slate-700 leading-tight">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WiFi callout */}
            {hotel.wifi_info && (
              <div className="flex items-center gap-4 bg-white rounded-3xl px-6 py-4" style={{ boxShadow: CARD_SHADOW }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#083344,#0E7490)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Complimentary WiFi</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">Password: {hotel.wifi_info}</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">Included</span>
              </div>
            )}

            {/* Nearby Tours */}
            {tours.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-7" style={{ boxShadow: CARD_SHADOW }}>
                <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2.5">
                  <span className="w-6 h-[3px] rounded-full inline-block" style={{ background: "linear-gradient(90deg,#F59E0B,#D97706)" }} />
                  Experiences near {hotel.city}
                </h2>
                <p className="text-xs text-slate-400 mb-4">Hand-picked tours and activities</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {tours.map(t => <TourCard key={t.id} tour={t} curr={curr} />)}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-4">

              {/* Booking card */}
              <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-slate-900/[0.03]" style={{ boxShadow: "0 8px 32px -8px rgba(8,145,178,0.20)" }}>

                {/* Header */}
                <div className="px-5 py-5 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #0C1A2E 0%, #083344 60%, #0E7490 100%)" }}>
                  <div className="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -right-2 top-6 w-16 h-16 rounded-full bg-white/5" />
                  <p className="relative text-cyan-200/70 text-[10px] font-black uppercase tracking-widest mb-1">Contact & Book</p>
                  <p className="relative text-white font-serif font-bold text-lg leading-snug">{hotel.name}</p>
                  <p className="relative text-cyan-300/70 text-xs mt-0.5">{hotel.city}, {hotel.country || "Italy"}</p>
                </div>

                <div className="p-4 space-y-2.5">
                  {/* Book Room — primary */}
                  {waHref ? (
                    <a href={waHref} target="_blank" rel="noopener noreferrer"
                      className="group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-white overflow-hidden transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                      style={{ background: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)", boxShadow: "0 10px 24px -8px rgba(8,145,178,0.55)" }}>
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out" />
                      <span className="relative w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                      </span>
                      <span className="relative flex-1 text-left min-w-0">
                        <span className="block font-black text-sm leading-tight">Book a Room</span>
                        <span className="block text-[11px] text-white/70 font-semibold mt-0.5">via WhatsApp · instant reply</span>
                      </span>
                      <IcoChevRight />
                    </a>
                  ) : hotel.email ? (
                    <a href={`mailto:${hotel.email}?subject=Room Booking – ${hotel.name}`}
                      className="group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-white overflow-hidden transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                      style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)", boxShadow: "0 10px 24px -8px rgba(8,145,178,0.5)" }}>
                      <span className="relative w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                        <IcoMail />
                      </span>
                      <span className="relative flex-1 text-left min-w-0">
                        <span className="block font-black text-sm leading-tight">Book a Room</span>
                        <span className="block text-[11px] text-white/70 font-semibold mt-0.5">via Email</span>
                      </span>
                      <IcoChevRight />
                    </a>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">or contact</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* WhatsApp */}
                  {hotel.whatsapp_number && (
                    <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                      style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", color: "#15803D" }}>
                      <IcoWA />
                      <span className="flex-1">WhatsApp</span>
                      <span className="text-xs opacity-60">{hotel.whatsapp_number}</span>
                    </a>
                  )}

                  {/* Phone */}
                  {hotel.phone && (
                    <a href={`tel:${hotel.phone}`}
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                      style={{ background: "#EFF9FF", border: "1.5px solid #BAE6FD", color: "#0369A1" }}>
                      <IcoPhone />
                      <span className="flex-1">Call</span>
                      <span className="text-xs opacity-60 truncate max-w-[110px]">{hotel.phone}</span>
                    </a>
                  )}

                  {/* Email */}
                  {hotel.email && (
                    <a href={`mailto:${hotel.email}`}
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                      style={{ background: "#FAF5FF", border: "1.5px solid #E9D5FF", color: "#6D28D9" }}>
                      <IcoMail />
                      <span className="flex-1">Email</span>
                      <span className="text-xs opacity-60 truncate max-w-[110px]">{hotel.email}</span>
                    </a>
                  )}
                </div>

                {/* Digital services */}
                {(hasCheckin || hasConcierge) && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Digital Services</p>
                    {hasCheckin && (
                      <Link href={`/request/${hotel.id}`}
                        className="flex items-center gap-3 w-full py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01]"
                        style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", color: "#6D28D9" }}>
                        <span>✅</span>
                        <span className="flex-1">Smart Check-in</span>
                        <IcoChevRight />
                      </Link>
                    )}
                    {hasConcierge && (
                      <Link href={`/h/${hotel.id}?lang=${lang}`}
                        className="flex items-center gap-3 w-full py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01]"
                        style={{ background: "#ECFEFF", border: "1.5px solid #A5F3FC", color: "#0E7490" }}>
                        <span>🔔</span>
                        <span className="flex-1">Digital Concierge</span>
                        <IcoChevRight />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ─────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "white",
          borderTop: "1px solid #E2E8F0",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}>
        <div className="px-4 pt-3 pb-3 space-y-2.5">
          {/* Primary CTA */}
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-[0.98] transition-transform"
              style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)", boxShadow: "0 4px 14px rgba(8,145,178,0.3)" }}>
              🛏️ Book a Room
            </a>
          ) : hotel.email ? (
            <a href={`mailto:${hotel.email}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg, #0891B2, #0E7490)" }}>
              🛏️ Book a Room
            </a>
          ) : null}

          {/* Secondary row */}
          <div className="flex gap-2">
            {hotel.whatsapp_number && (
              <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", color: "#15803D" }}>
                <IcoWA /> WhatsApp
              </a>
            )}
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "#EFF9FF", border: "1.5px solid #BAE6FD", color: "#0369A1" }}>
                <IcoPhone /> Call
              </a>
            )}
            {hasCheckin && (
              <Link href={`/request/${hotel.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", color: "#6D28D9" }}>
                ✅ Check-in
              </Link>
            )}
            {hasConcierge && (
              <Link href={`/h/${hotel.id}?lang=${lang}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "#ECFEFF", border: "1.5px solid #A5F3FC", color: "#0E7490" }}>
                🔔 Concierge
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ─────────────────────────────────────────── */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={e => { e.stopPropagation(); setLightbox(l => ((l! - 1 + photos.length) % photos.length)); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="relative w-full max-w-4xl aspect-video mx-8" onClick={e => e.stopPropagation()}>
            <Image unoptimized src={photos[lightbox]} alt="" fill className="object-contain" />
          </div>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={e => { e.stopPropagation(); setLightbox(l => (l! + 1) % photos.length); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-semibold">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tour card ─────────────────────────────────────────────────────────────────
function TourCard({ tour, curr }: { tour: Tour; curr: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-white">
      {tour.image_url ? (
        <div className="relative h-28 overflow-hidden">
          <Image unoptimized src={tour.image_url} alt={tour.title} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-28 flex items-center justify-center bg-slate-50">
          <span className="text-3xl opacity-30">🗺️</span>
        </div>
      )}
      <div className="p-3.5">
        <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5rem]">{tour.title}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-black" style={{ color: tour.price != null ? "#0891B2" : "#059669" }}>
            {tour.price != null ? `${curr}${tour.price}` : "Free"}
          </span>
          {tour.affiliate_link && (
            <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-black px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "#EFF9FF", color: "#0891B2", border: "1px solid #BAE6FD" }}>
              Book →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
