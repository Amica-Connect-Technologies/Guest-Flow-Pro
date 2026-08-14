"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Demo Request Modal ───────────────────────────────────────────────────────
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Demo Requested!</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              We'll contact you within 24 hours to schedule your personalised demo.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-cyan-700 text-white font-bold px-6 py-3 rounded-2xl hover:bg-cyan-800 transition-colors text-sm"
            >
              Close
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
              <h3 className="text-xl font-black text-slate-900 mb-1">Request a Free Demo</h3>
              <p className="text-slate-500 text-sm">
                We'll show you exactly what your hotel's portal would look like.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Your Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Hotel Name *
                </label>
                <input
                  required
                  value={form.hotel}
                  onChange={(e) => setForm({ ...form, hotel: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="The Grand Hotel"
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
                  placeholder="you@yourhotel.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  WhatsApp Number
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
                  Something went wrong. Please try again or contact us directly.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
              >
                {status === "sending" ? "Sending…" : "Request Free Demo →"}
              </button>
              <p className="text-center text-xs text-slate-400">
                No commitment required · We respond within 24 hours
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page Data ────────────────────────────────────────────────────────────────
const STATS = [
  { icon: "✓", label: "11 Properties Live" },
  { icon: "✓", label: "8 Cities" },
  { icon: "✓", label: "24/7 Guest Support" },
  { icon: "✓", label: "WhatsApp-Native" },
];

const PAIN_QUOTES = [
  '"Can you book a restaurant for tonight?"',
  '"What time does the spa open?"',
  '"How do I get to the city centre?"',
  '"Is there a shuttle to the airport?"',
];

const STEPS = [
  {
    n: "1",
    title: "We onboard your hotel",
    desc: "You share your services, contacts, and branding.",
  },
  {
    n: "2",
    title: "We build your concierge portal",
    desc: "A custom digital hub with your logo and services.",
  },
  {
    n: "3",
    title: "Guests scan or tap",
    desc: "Via QR code, WhatsApp link, or your website.",
  },
  {
    n: "4",
    title: "They get instant answers",
    desc: "Reservations, info, experiences — 24/7.",
  },
];

const FEATURES = [
  {
    icon: "🛎️",
    title: "Reservations",
    desc: "Restaurant, spa, activities — all bookable directly from the guest's phone.",
    color: "#F97316",
    bg: "#FFF7ED",
  },
  {
    icon: "✈️",
    title: "Pre-Arrival",
    desc: "Send guests essential info before they check in, reducing front desk pressure.",
    color: "#0891B2",
    bg: "#ECFEFF",
  },
  {
    icon: "🗺️",
    title: "Local Experiences",
    desc: "Tours, events, city guides curated for your property — always up to date.",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    icon: "💍",
    title: "Weddings & Events",
    desc: "Dedicated concierge flows for special occasions with custom information.",
    color: "#DB2777",
    bg: "#FDF2F8",
  },
  {
    icon: "🌙",
    title: "Night Life",
    desc: "Local bar and club recommendations instantly accessible to every guest.",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: "📍",
    title: "Location & Transport",
    desc: "Directions, shuttles, taxis and transport options — all in one place.",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: "💬",
    title: "WhatsApp Integration",
    desc: "Guests message you where they already are — no new apps, no friction.",
    color: "#16A34A",
    bg: "#F0FDF4",
  },
  {
    icon: "🌐",
    title: "Multilingual Support",
    desc: "Serve international guests in their language — English, Italian, Spanish and more.",
    color: "#D97706",
    bg: "#FFFBEB",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForHotelsView() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {modalOpen && <DemoModal onClose={() => setModalOpen(false)} />}

      <div className="min-h-screen">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0A0F2E 0%, #0C2D48 50%, #0E4F6B 100%)",
            minHeight: "92vh",
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Glow blobs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #0891B2, transparent 70%)" }} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-8 pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366F1, transparent 70%)" }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-32 text-center">
            <span className="inline-block bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
              For Hotel Owners & Managers
            </span>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-tight mb-6"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Give Every Guest a{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #38BDF8, #22D3EE)" }}>
                5-Star Concierge Experience
              </span>
              {" "}— Without Hiring One
            </h1>

            <p className="text-lg text-slate-300/80 leading-relaxed mb-10 max-w-2xl mx-auto">
              GuestFlowPro puts a digital concierge in every guest's pocket.
              Reservations, pre-arrival, local experiences, spa, events — all in
              one link, available 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-white text-slate-900 font-black px-8 py-4 rounded-2xl hover:bg-cyan-50 transition-colors shadow-2xl text-base"
              >
                Request a Free Demo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-base"
              >
                See a Live Example →
              </Link>
            </div>

            <p className="text-slate-400 text-sm">
              Trusted by hotels in Italy, the UK, and Spain · Setup in under 48 hours
            </p>
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0 leading-none">
            <svg viewBox="0 0 1440 60" fill="white" xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
              <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,60 Z" />
            </svg>
          </div>
        </section>

        {/* ── Social Proof Bar ────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center">
                    ✓
                  </span>
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
                The Problem
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 leading-tight"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Your guests have questions.{" "}
                <span className="text-slate-400">Your staff can't answer all of them.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {PAIN_QUOTES.map((q) => (
                <div
                  key={q}
                  className="flex items-start gap-3 bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100"
                >
                  <span className="text-slate-300 text-2xl leading-none mt-0.5">"</span>
                  <p className="text-slate-600 font-medium text-sm italic leading-relaxed">
                    {q.replace(/^"|"$/g, "")}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-3xl p-8 border border-cyan-100 text-center">
              <p className="text-slate-700 text-base leading-relaxed max-w-2xl mx-auto">
                That's time your team could spend on{" "}
                <strong>high-value guest interactions</strong>. GuestFlowPro handles
                the routine — instantly, in the guest's language, on their phone.
              </p>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full">
                How It Works
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Up and running in 48 hours.{" "}
                <span className="text-slate-400">No app download required.</span>
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
                Features
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-black text-slate-900"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Everything your guests need.{" "}
                <span className="text-cyan-600">One link.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl p-6 border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full">
                Pricing
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                Choose your plan
              </h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                Simple monthly pricing per property. No setup fees, no hidden costs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* £25 — Digital Concierge */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">Starter</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-slate-900">£25</span>
                  <span className="text-slate-400 text-sm font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm font-bold text-slate-700 mb-4">Digital Concierge</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {["QR Code for guests", "Hotel services page", "Services catalogue", "Custom branding", "WhatsApp integration"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-blue-500 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?plan=concierge"
                  className="w-full text-center bg-blue-50 text-blue-700 font-black py-3 rounded-2xl hover:bg-blue-100 transition-colors text-sm">
                  Get Started →
                </Link>
              </div>

              {/* £50 — Smart Check-in */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-violet-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-1">Essentials</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-slate-900">£50</span>
                  <span className="text-slate-400 text-sm font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm font-bold text-slate-700 mb-4">Smart Check-in</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {["Digital guest registration", "Pre-arrival check-in", "Guest information collection", "Document management", "Check-in dashboard"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-violet-500 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?plan=checkin"
                  className="w-full text-center bg-violet-50 text-violet-700 font-black py-3 rounded-2xl hover:bg-violet-100 transition-colors text-sm">
                  Get Started →
                </Link>
              </div>

              {/* £75 — Guest Experience Pro (POPULAR) */}
              <div className="bg-gradient-to-b from-cyan-700 to-cyan-800 rounded-3xl p-6 flex flex-col shadow-xl shadow-cyan-200 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-200 mb-1">Professional</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">£75</span>
                  <span className="text-cyan-300 text-sm font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm font-bold text-white mb-4">Guest Experience Pro</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {["Everything in Digital Concierge", "Everything in Smart Check-in", "Complete digital guest journey", "QR code access", "Custom branding colour"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-cyan-300 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?plan=concierge_checkin"
                  className="w-full text-center bg-white text-cyan-800 font-black py-3 rounded-2xl hover:bg-cyan-50 transition-colors text-sm shadow-md">
                  Get Started →
                </Link>
              </div>

              {/* £100 — Full Suite */}
              <div className="bg-slate-900 rounded-3xl p-6 flex flex-col hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">Enterprise</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">£100</span>
                  <span className="text-slate-400 text-sm font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm font-bold text-slate-300 mb-4">Full Suite</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {["Everything in Professional", "Free booking management", "Guest reviews & ratings", "Email marketing automation", "API access & webhooks"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-amber-400 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?plan=full"
                  className="w-full text-center bg-amber-400 text-slate-900 font-black py-3 rounded-2xl hover:bg-amber-300 transition-colors text-sm">
                  Get Started →
                </Link>
              </div>
            </div>

            <p className="text-center text-slate-400 text-sm mt-8">
              All plans include 14-day free trial · Cancel anytime ·{" "}
              <button onClick={() => setModalOpen(true)} className="text-cyan-700 font-semibold hover:underline">
                Contact us for custom pricing
              </button>
            </p>
          </div>
        </section>

        {/* ── Testimonial ─────────────────────────────────────────────────────── */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              What Our Partners Say
            </span>
            <div className="mt-10 relative">
              <div className="text-6xl text-cyan-700/30 font-serif leading-none mb-4">"</div>
              <blockquote className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-8" style={{ textWrap: "balance" } as React.CSSProperties}>
                GuestFlowPro transformed how we handle guest requests. Our front
                desk team finally has breathing room.
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-black text-sm">
                  S
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Hotel Manager</p>
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
              Ready to upgrade your guest experience?
            </h2>
            <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join the hotels already using GuestFlowPro to deliver a seamless,
              modern concierge service — with zero extra staff.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-black px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-xl shadow-cyan-200 text-base"
              >
                Request Your Free Demo →
              </button>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-base"
              >
                See a Live Example →
              </Link>
            </div>

            <p className="text-slate-400 text-sm">
              No commitment required. We'll show you exactly what your hotel's portal would look like.
            </p>
          </div>
        </section>

      </div>
    </>
  );
}
