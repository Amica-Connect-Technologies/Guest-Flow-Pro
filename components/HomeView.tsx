"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { hotelsApi, type Hotel } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

// ─── CSS Phone Mockup ─────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 260, height: 520 }}>
      {/* Glow behind phone */}
      <div
        className="absolute inset-0 rounded-[48px] opacity-25 blur-3xl"
        style={{ background: "radial-gradient(ellipse, #0891B2 30%, #7C3AED 100%)" }}
      />
      {/* Phone shell */}
      <div
        className="absolute inset-0 rounded-[44px] shadow-2xl shadow-black/60"
        style={{ background: "linear-gradient(155deg, #334155, #0f172a)" }}
      />
      {/* Screen */}
      <div className="absolute inset-[9px] rounded-[37px] overflow-hidden bg-white">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[22px] bg-slate-900 rounded-b-3xl z-10" />
        {/* Status bar */}
        <div className="h-[22px] bg-slate-900 flex items-center justify-end px-4">
          <span className="text-white/50 text-[9px]">9:41</span>
        </div>
        {/* App UI */}
        <div className="flex flex-col" style={{ height: "calc(100% - 22px)" }}>
          {/* App header */}
          <div className="px-4 pt-4 pb-3" style={{ background: "linear-gradient(135deg, #0E4F6B, #0891B2)" }}>
            <div className="text-white font-bold text-[13px]">The Solarium</div>
            <div className="text-cyan-200/80 text-[9px] mt-0.5">Civitanova Marche · Digital Concierge</div>
            <div className="flex gap-1 mt-3">
              {[["🍽️","Food"],["🅿️","Park"],["🌙","Night"],["🗺️","Tours"]].map(([e,l],i) => (
                <div key={i} className={`flex-1 rounded-lg py-1.5 text-center ${i===0 ? "bg-white/20 text-white" : "text-white/50"}`}>
                  <div className="text-[14px] leading-none">{e}</div>
                  <div className="text-[8px] font-medium mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Scrollable content */}
          <div className="flex-1 bg-slate-50 px-3 pt-3 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">Nearby</div>
            {[
              ["La Piazza","Italian · 200m","#FFF7ED"],
              ["Sushi Garden","Japanese · 350m","#F0FDF4"],
              ["Café Roma","Café · 100m","#EFF6FF"],
            ].map(([name,sub,bg],i) => (
              <div key={i} className="bg-white rounded-xl mb-2 p-2.5 flex items-center gap-2 shadow-sm border border-slate-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: bg as string }}>🍴</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 truncate">{name}</div>
                  <div className="text-[9px] text-slate-400">{sub}</div>
                </div>
                <span className="text-[9px] text-cyan-600 font-bold shrink-0">Book</span>
              </div>
            ))}
            <div
              className="mt-1.5 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-white text-[11px] font-bold"
              style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
            >
              <span className="text-[13px]">💬</span> Chat with Reception
            </div>
          </div>
        </div>
      </div>
      {/* Physical side buttons */}
      <div className="absolute right-[-3px] top-24 w-[3px] h-10 bg-slate-600 rounded-r" />
      <div className="absolute left-[-3px] top-20 w-[3px] h-6 bg-slate-600 rounded-l" />
      <div className="absolute left-[-3px] top-[7.5rem] w-[3px] h-10 bg-slate-600 rounded-l" />
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURE_STYLES = [
  { emoji: "🍽️", bg: "#FFF7ED" },
  { emoji: "🛎️", bg: "#ECFEFF" },
  { emoji: "🗺️", bg: "#ECFDF5" },
  { emoji: "💬", bg: "#F5F3FF" },
];

const GUEST_TITLE: Record<string, string> = {
  en: "Are you a guest?",
  it: "Sei un ospite?",
  es: "¿Eres huésped?",
};

const GUEST_DESC: Record<string, string> = {
  en: "Scan the QR code in your hotel room or find your hotel below.",
  it: "Scansiona il QR code nella tua stanza o trova il tuo hotel qui sotto.",
  es: "Escanea el código QR en tu habitación o encuentra tu hotel abajo.",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeView() {
  const { t, lang } = useLanguage();
  const h = t.home;
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    hotelsApi.list().then(d => setHotels(d.slice(0, 3))).catch(() => {});
  }, []);

  const features = [
    { ...FEATURE_STYLES[0], title: h.f1Title, desc: h.f1Desc },
    { ...FEATURE_STYLES[1], title: h.f2Title, desc: h.f2Desc },
    { ...FEATURE_STYLES[2], title: h.f3Title, desc: h.f3Desc },
    { ...FEATURE_STYLES[3], title: h.f4Title, desc: h.f4Desc },
  ];

  const steps = [
    { n: "01", title: h.s1Title, desc: h.s1Desc },
    { n: "02", title: h.s2Title, desc: h.s2Desc },
    { n: "03", title: h.s3Title, desc: h.s3Desc },
  ];

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#091230 0%,#0E4F6B 60%,#0A7FA8 100%)", minHeight: "92vh" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{ top:"15%",right:"5%",width:480,height:480,background:"radial-gradient(circle,rgba(8,145,178,0.2),transparent 70%)",filter:"blur(50px)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 lg:pt-32 lg:pb-40">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block text-cyan-300 text-xs font-bold uppercase tracking-widest mb-6 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10">
                {h.heroKicker}
              </span>

              <h1
                className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-white leading-tight mb-5"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                {h.heroTitle}
              </h1>

              <p className="text-lg text-cyan-100/70 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                {h.heroSub}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <Link
                  href="/hotels"
                  className="inline-flex items-center justify-center gap-2.5 bg-white text-cyan-900 font-bold px-7 py-3.5 rounded-2xl hover:bg-cyan-50 transition-colors shadow-xl text-sm"
                >
                  {h.ctaHotels}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/for-hotels"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/25 text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-colors text-sm"
                >
                  {h.ctaRegister}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 justify-center lg:justify-start flex-wrap">
                <div className="flex -space-x-2">
                  {(["#0891B2","#7C3AED","#059669"] as string[]).map((c,i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: c, zIndex: 3 - i }}
                    >
                      {["IT","UK","PK"][i]}
                    </div>
                  ))}
                </div>
                <p className="text-cyan-200/60 text-xs">
                  Trusted by hotels in{" "}
                  <span className="text-cyan-300 font-semibold">Italy · UK · Pakistan</span>
                </p>
              </div>
            </div>

            {/* Right: Phone mockup — desktop only */}
            <div className="hidden lg:block flex-shrink-0 relative">
              {/* Floating badge: new booking */}
              <div className="absolute -top-6 -left-10 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2.5 z-20 border border-slate-100">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-lg shrink-0">✅</div>
                <div>
                  <div className="text-slate-900 font-bold text-xs">New Reservation</div>
                  <div className="text-slate-400 text-[10px]">La Piazza · Tonight 8:00 PM</div>
                </div>
              </div>
              {/* Floating badge: WhatsApp */}
              <div className="absolute -bottom-4 -right-8 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2.5 z-20 border border-slate-100">
                <div className="text-xl shrink-0">💬</div>
                <div>
                  <div className="text-slate-900 font-bold text-xs">WhatsApp</div>
                  <div className="text-emerald-500 text-[10px] font-semibold">● Guest online</div>
                </div>
              </div>
              <PhoneMockup />
            </div>

          </div>
        </div>

        {/* Wave bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 56" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display:"block",width:"100%",height:56 }}>
            <path d="M0,56 L0,28 Q360,0 720,28 Q1080,56 1440,28 L1440,56 Z" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "11+",  label: "Hotels" },
              { value: "8",    label: "Cities" },
              { value: "3",    label: "Languages" },
              { value: "24/7", label: "Support" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-cyan-700">{s.value}</div>
                <div className="text-slate-500 text-sm font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-black text-slate-900"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              {h.featuresTitle}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-white rounded-3xl p-7 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ background: f.bg }}>
                  {f.emoji}
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">{h.howTitle}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{h.howSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-cyan-200 via-cyan-400 to-cyan-200" />
            {steps.map(s => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white font-black text-2xl flex items-center justify-center mb-5 shadow-xl shadow-cyan-200/60 relative z-10">
                  {s.n}
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner Hotels ────────────────────────────────────────────────────── */}
      {hotels.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900">{h.hotelsTitle}</h2>
                <p className="text-slate-500 text-sm mt-1">Live properties powered by GuestFlowPro</p>
              </div>
              <Link
                href="/hotels"
                className="flex items-center gap-1.5 text-cyan-700 font-bold text-sm hover:text-cyan-800 transition-colors"
              >
                {h.hotelsBtn}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map(hotel => (
                <Link
                  key={hotel.id}
                  href={`/h/${hotel.id}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-cyan-100 transition-all duration-200"
                >
                  <div className="h-48 bg-gradient-to-br from-cyan-50 to-slate-100 relative overflow-hidden">
                    {hotel.gallery_images && hotel.gallery_images.length > 0 ? (
                      <Image
                        unoptimized
                        src={hotel.gallery_images[0].image_url}
                        alt={hotel.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : hotel.logo_url ? (
                      <Image
                        src={hotel.logo_url}
                        alt={hotel.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl opacity-40">🏨</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-cyan-700 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                      <span>📍</span>{hotel.city}
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        ● Live
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Dual CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg,#0C1E35 0%,#0E4F6B 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Guests */}
            <div className="rounded-3xl p-8 text-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-black text-white mb-3">
                {GUEST_TITLE[lang] ?? GUEST_TITLE.en}
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(207,250,254,0.6)" }}>
                {GUEST_DESC[lang] ?? GUEST_DESC.en}
              </p>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 bg-white text-cyan-900 font-bold px-6 py-3 rounded-2xl hover:bg-cyan-50 transition-colors text-sm shadow-lg"
              >
                {h.ctaHotels} →
              </Link>
            </div>
            {/* Hotel owners */}
            <div className="rounded-3xl p-8 text-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="text-5xl mb-4">🏨</div>
              <h3 className="text-xl font-black text-white mb-3">{h.forHotelsTitle}</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(207,250,254,0.6)" }}>
                {h.forHotelsSub}
              </p>
              <Link
                href="/for-hotels"
                className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity text-sm shadow-lg text-white"
                style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}
              >
                {h.forHotelsBtn} →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
