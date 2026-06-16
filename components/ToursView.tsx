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
    <div className="min-h-screen bg-slate-50">

      <Script
        async
        defer
        src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
        data-gyg-partner-id="E1C9YRK"
        strategy="lazyOnload"
      />

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{t.tours.liveAvailability}</p>
        <h1 className="text-lg font-bold text-slate-900">{t.tours.pageTitle}</h1>
      </div>

      {/* ── GetYourGuide Live Widgets ───────────────────── */}
      <section className="px-4 py-4 space-y-6">
        {GYG_LOCATION_IDS.map((locationId) => (
          <div key={locationId}
            data-gyg-href="https://widget.getyourguide.com/default/city.frame"
            data-gyg-location-id={locationId}
            data-gyg-locale-code="it-IT"
            data-gyg-widget="city"
            data-gyg-partner-id="E1C9YRK"
          />
        ))}
      </section>
    </div>
  );
}
