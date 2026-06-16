"use client";

import Script from "next/script";
import { useLanguage } from "@/lib/LanguageContext";

export default function ToursView() {
  const { t } = useLanguage();
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
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="200"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="863"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="3954"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="3953"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="5000"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id="31006"
          data-gyg-locale-code="it-IT"
          data-gyg-widget="city"
          data-gyg-partner-id="E1C9YRK"
        />
      </section>
    </div>
  );
}
