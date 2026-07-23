"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Demo Modal (Italian) ─────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", hotel: "", email: "", whatsapp: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/demo-requests/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {status === "done" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Demo Richiesta!</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ti contatteremo entro 24 ore per fissare la tua demo personalizzata.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-cyan-700 text-white font-bold px-6 py-3 rounded-2xl hover:bg-cyan-800 transition-colors text-sm"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 mb-1">Richiedi una Demo Gratuita</h3>
              <p className="text-slate-500 text-sm">
                Ti mostreremo esattamente come sarebbe il portale del tuo albergo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Il Tuo Nome *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Nome dell&apos;Hotel *
                </label>
                <input
                  required
                  value={form.hotel}
                  onChange={(e) => setForm({ ...form, hotel: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Hotel Bellissimo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="info@tuohotel.it"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Numero WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="+39 320 000 0000"
                />
              </div>

              {status === "error" && (
                <p className="text-red-500 text-xs">
                  Qualcosa è andato storto. Riprova o contattaci direttamente.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
              >
                {status === "sending" ? "Invio in corso…" : "Richiedi Demo Gratuita →"}
              </button>
              <p className="text-center text-xs text-slate-400">
                Nessun impegno richiesto · Rispondiamo entro 24 ore
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page Data (Italian) ──────────────────────────────────────────────────────
const STATS = [
  { label: "11 Proprietà Online" },
  { label: "8 Città" },
  { label: "Supporto 24/7" },
  { label: "WhatsApp Nativo" },
];

const PAIN_QUOTES = [
  "Puoi prenotarmi un ristorante stasera?",
  "A che ora apre la spa?",
  "Come raggiungo il centro città?",
  "C'è una navetta per l'aeroporto?",
];

const STEPS = [
  { n: "1", title: "Onboarding del tuo albergo", desc: "Condividi i tuoi servizi, contatti e branding." },
  { n: "2", title: "Costruiamo il tuo portale", desc: "Un hub digitale personalizzato con il tuo logo e servizi." },
  { n: "3", title: "Gli ospiti scansionano o toccano", desc: "Via codice QR, link WhatsApp, o il tuo sito web." },
  { n: "4", title: "Risposte istantanee", desc: "Prenotazioni, info, esperienze — 24/7." },
];

const FEATURES = [
  { icon: "🛎️", title: "Prenotazioni",        desc: "Ristorante, spa, attività — tutto prenotabile direttamente dal telefono dell'ospite.", color: "#F97316", bg: "#FFF7ED" },
  { icon: "✈️", title: "Pre-Arrivo",           desc: "Invia agli ospiti info essenziali prima del check-in, riducendo la pressione sulla reception.", color: "#0891B2", bg: "#ECFEFF" },
  { icon: "🗺️", title: "Esperienze Locali",   desc: "Tour, eventi, guide cittadine curate per la tua proprietà — sempre aggiornate.", color: "#059669", bg: "#ECFDF5" },
  { icon: "💍", title: "Matrimoni & Eventi",   desc: "Flussi concierge dedicati per occasioni speciali con informazioni personalizzate.", color: "#DB2777", bg: "#FDF2F8" },
  { icon: "🌙", title: "Vita Notturna",        desc: "Consigli locali su bar e locali istantaneamente accessibili a ogni ospite.", color: "#7C3AED", bg: "#F5F3FF" },
  { icon: "📍", title: "Posizione & Trasporti", desc: "Indicazioni, navette, taxi — tutto in un posto.", color: "#2563EB", bg: "#EFF6FF" },
  { icon: "💬", title: "Integrazione WhatsApp", desc: "Gli ospiti ti messaggiano dove già sono — nessuna app nuova, nessuna frizione.", color: "#16A34A", bg: "#F0FDF4" },
  { icon: "🌐", title: "Supporto Multilingue", desc: "Servi ospiti internazionali nella loro lingua — inglese, italiano, spagnolo e altro.", color: "#D97706", bg: "#FFFBEB" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForHotelsViewIT() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {modalOpen && <DemoModal onClose={() => setModalOpen(false)} />}

      <div className="min-h-screen">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0A0F2E 0%, #0C2D48 50%, #0E4F6B 100%)", minHeight: "92vh" }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #0891B2, transparent 70%)" }} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366F1, transparent 70%)" }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-32 text-center">
            <span className="inline-block bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
              Per Proprietari e Direttori di Hotel
            </span>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-tight mb-6"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Regala a Ogni Ospite un&apos;Esperienza da{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #38BDF8, #22D3EE)" }}>
                Concierge Stellato
              </span>
              {" "}— Senza Assumere Nessuno
            </h1>

            <p className="text-lg text-slate-300/80 leading-relaxed mb-10 max-w-2xl mx-auto">
              GuestFlowPro mette un concierge digitale in tasca di ogni ospite.
              Prenotazioni, pre-arrivo, esperienze locali, spa, eventi — tutto in
              un link, disponibile 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-white text-slate-900 font-black px-8 py-4 rounded-2xl hover:bg-cyan-50 transition-colors shadow-2xl text-base"
              >
                Richiedi una Demo Gratuita
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-base"
              >
                Vedi un Esempio Live →
              </Link>
            </div>

            <p className="text-slate-400 text-sm">
              Scelto da hotel in Italia, nel Regno Unito e in Pakistan · Attivo in meno di 48 ore
            </p>
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0 leading-none">
            <svg viewBox="0 0 1440 60" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display:"block",width:"100%",height:60 }}>
              <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,60 Z" />
            </svg>
          </div>
        </section>

        {/* ── Social Proof Bar ────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {STATS.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center">✓</span>
                  <span className="text-slate-700 font-semibold text-sm">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Problem Section ─────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full">
                Il Problema
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 leading-tight"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                I tuoi ospiti hanno domande.{" "}
                <span className="text-slate-400">Il tuo staff non può rispondere a tutte.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {PAIN_QUOTES.map(q => (
                <div key={q} className="flex items-start gap-3 bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                  <span className="text-slate-300 text-2xl leading-none mt-0.5">&ldquo;</span>
                  <p className="text-slate-600 font-medium text-sm italic leading-relaxed">{q}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-3xl p-8 border border-cyan-100 text-center">
              <p className="text-slate-700 text-base leading-relaxed max-w-2xl mx-auto">
                È tempo che il tuo team potrebbe dedicare a{" "}
                <strong>interazioni più importanti con gli ospiti</strong>.
                GuestFlowPro gestisce la routine — istantaneamente, nella lingua dell&apos;ospite, sul suo telefono.
              </p>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full">
                Come Funziona
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Attivo e funzionante in 48 ore.{" "}
                <span className="text-slate-400">Nessun download di app richiesto.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-cyan-200 to-transparent z-0 -translate-y-0.5" style={{ width: "calc(100% - 2rem)" }} />
                  )}
                  <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-100">
                      {s.n}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">{s.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                Funzionalità
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Tutto quello che i tuoi ospiti servono.{" "}
                <span className="text-cyan-600">Un link.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(f => (
                <div
                  key={f.title}
                  className="rounded-3xl p-6 border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4" style={{ background: f.bg }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing Teaser ──────────────────────────────────────────────────── */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #0C2D48 0%, #0E4F6B 100%)" }}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 rounded-full">
              Prezzi
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white mb-4">
              Prezzi semplici. Nessuna sorpresa.
            </h2>
            <p className="text-slate-300 text-lg mb-2">
              Piani a partire da <strong className="text-white">€49/mese</strong> per proprietà.
            </p>
            <p className="text-slate-400 text-sm mb-10">
              Tutto incluso — setup, hosting, aggiornamenti e supporto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-7 py-3.5 rounded-2xl hover:bg-cyan-50 transition-colors text-sm shadow-xl"
              >
                Vedi Prezzi Completi →
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 border-2 border-white/25 text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-colors text-sm"
              >
                Parliamone Prima →
              </button>
            </div>
          </div>
        </section>

        {/* ── Testimonial ─────────────────────────────────────────────────────── */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Cosa Dicono i Nostri Partner
            </span>
            <div className="mt-10">
              <div className="text-6xl text-cyan-700/30 font-serif leading-none mb-4">&ldquo;</div>
              <blockquote
                className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-8"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                GuestFlowPro ha trasformato il modo in cui gestiamo le richieste degli ospiti.
                Il nostro team di reception finalmente ha lo spazio per respirare.
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-black text-sm">S</div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Direttore dell&apos;Hotel</p>
                  <p className="text-slate-400 text-xs">The Solarium, Civitanova Marche</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────────── */}
        <section className="py-28 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2
              className="text-3xl sm:text-4xl font-black text-slate-900 mb-4"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Pronto a migliorare l&apos;esperienza dei tuoi ospiti?
            </h2>
            <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Unisciti agli alberghi che usano già GuestFlowPro per fornire un servizio
              concierge fluido e moderno — senza personale extra.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-black px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-xl shadow-cyan-200 text-base"
              >
                Richiedi la Tua Demo Gratuita →
              </button>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-base"
              >
                Vedi un Esempio Live →
              </Link>
            </div>

            <p className="text-slate-400 text-sm">
              Nessun impegno. Ti mostreremo esattamente come sarebbe il portale del tuo albergo.
            </p>
          </div>
        </section>

      </div>
    </>
  );
}
