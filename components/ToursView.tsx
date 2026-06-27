"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useLanguage } from "@/lib/LanguageContext";

export const GYG_LOCATION_IDS = ["193094", "32", "200", "863", "3954", "3953", "5000", "31006", "262718"];

// Shown automatically whenever GetYourGuide's own widget fails to load an image for a city.
const GYG_FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#083344"/>
          <stop offset="100%" stop-color="#0E7490"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g)"/>
      <g fill="#ffffff" fill-opacity="0.35">
        <path d="M200 86c-19.3 0-35 15.7-35 35 0 26.3 35 65 35 65s35-38.7 35-65c0-19.3-15.7-35-35-35zm0 49a14 14 0 110-28 14 14 0 010 28z"/>
      </g>
    </svg>`
  );

export function useGygImageFallback() {
  useEffect(() => {
    function handleImageError(e: Event) {
      const img = e.target as HTMLElement;
      if (img.tagName === "IMG" && img.closest("[data-gyg-widget]")) {
        const el = img as HTMLImageElement;
        if (el.src !== GYG_FALLBACK_IMAGE) el.src = GYG_FALLBACK_IMAGE;
      }
    }
    document.addEventListener("error", handleImageError, true);
    return () => document.removeEventListener("error", handleImageError, true);
  }, []);
}

export default function ToursView() {
  const { t } = useLanguage();
  useGygImageFallback();

  return (
    <div className="min-h-screen" style={{ background: "#ECEEF3" }}>

      <Script
        async defer
        src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
        data-gyg-partner-id="E1C9YRK"
        strategy="lazyOnload"
      />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #020B12 0%, #083344 35%, #0A4A5E 65%, #0E7490 100%)" }}>

        {/* Dot texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(103,232,249,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(2,11,18,0.25))" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: heading */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-[11px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "rgba(103,232,249,0.75)" }}>
                  {t.tours.liveAvailability}
                </span>
              </div>
              <h1 className="text-white font-black leading-none mb-3"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
                {t.tours.pageTitle}
              </h1>
              <p className="max-w-md leading-relaxed"
                style={{ fontSize: "clamp(0.875rem, 1.5vw, 1rem)", color: "rgba(255,255,255,0.45)" }}>
                Handpicked tours, activities &amp; day trips — instant booking via GetYourGuide
              </p>
            </div>

            {/* Right: trust stats */}
            <div className="flex flex-row md:flex-col gap-3 flex-shrink-0">
              {[
                { n: "9+",   label: "Destinations", emoji: "🗺️" },
                { n: "500+", label: "Activities",   emoji: "🎯" },
                { n: "4.8★", label: "Avg Rating",   emoji: "⭐" },
              ].map(({ n, label, emoji }) => (
                <div key={label}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(103,232,249,0.14)" }}>
                  <span className="text-lg leading-none flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-black text-white text-sm leading-none">{n}</p>
                    <p className="text-[10px] font-semibold mt-0.5"
                      style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          WIDGET GRID
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-7 space-y-5">
        {GYG_LOCATION_IDS.map((locationId) => (
          <div key={locationId}
            className="bg-white rounded-3xl overflow-hidden"
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

        {/* Footer attribution */}
        <div className="flex items-center justify-center gap-3 pt-2 pb-4">
          <div className="h-px flex-1 max-w-[120px] bg-slate-200" />
          <p className="text-xs font-semibold text-slate-400">
            Tours &amp; activities powered by <strong className="text-slate-500">GetYourGuide</strong>
          </p>
          <div className="h-px flex-1 max-w-[120px] bg-slate-200" />
        </div>
      </section>

    </div>
  );
}
