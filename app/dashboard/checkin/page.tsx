"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, checkinApi, type CheckinBooking, type CheckinStats } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  completed:    "bg-emerald-100 text-emerald-700",
  missing_info: "bg-red-100 text-red-700",
  expired:      "bg-slate-100 text-slate-500",
};

export default function CheckinDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const c = t.checkin;

  const [stats, setStats]   = useState<CheckinStats | null>(null);
  const [recent, setRecent] = useState<CheckinBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    auth.me()
      .then(() =>
        Promise.all([checkinApi.stats(), checkinApi.listBookings()])
      )
      .then(([s, bookings]) => { setStats(s); setRecent(bookings.slice(0, 8)); })
      .catch(err => {
        const msg = err.message ?? "";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("authentication")) {
          router.replace("/login");
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const statusLabel = (s: string) => (c.status as Record<string, string>)[s] ?? s;

  return (
    <div className="min-h-screen" style={{ background: "#F0F2F7" }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)", boxShadow: "0 4px 24px rgba(2,11,18,0.35)" }}>
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.20) 0%, transparent 65%)" }} />
        <div className="px-5 pt-10 pb-5 max-w-3xl mx-auto">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-cyan-300/80 text-sm font-semibold mb-4 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">{c.navLabel}</p>
          <h1 className="text-2xl font-black text-white">{c.dashboard.title}</h1>
          <p className="text-cyan-200/70 text-sm mt-1">{c.dashboard.subtitle}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-3xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/checkin/new"
            className="relative overflow-hidden rounded-2xl p-5 text-white flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 6px 20px rgba(14,116,144,0.35)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm font-black">{c.dashboard.newBooking}</p>
          </Link>
          <Link href="/dashboard/checkin/bookings"
            className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#ECFEFF" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#0E7490" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-700">{c.dashboard.allBookings}</p>
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "today",     label: c.dashboard.cards.today,    color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
              { key: "tomorrow",  label: c.dashboard.cards.tomorrow, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { key: "pending",   label: c.dashboard.cards.pending,  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { key: "completed", label: c.dashboard.cards.completed,color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
                icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></> },
              { key: "missing",   label: c.dashboard.cards.missing,  color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
              { key: "total",     label: c.dashboard.cards.total,    color: "#475569", bg: "#F8FAFC", border: "#E2E8F0",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
            ] as { key: keyof CheckinStats; label: string; color: string; bg: string; border: string; icon: React.ReactNode }[]).map(({ key, label, color, bg, border, icon }) => (
              <div key={key} className="bg-white rounded-2xl p-4 flex items-center gap-3"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24">{icon}</svg>
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color }}>{stats[key]}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent bookings — all, sorted by API default (newest first) */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-800">{c.dashboard.recentArrivals}</h2>
            <Link href="/dashboard/checkin/bookings"
              className="text-xs font-bold text-cyan-600 hover:underline">{c.dashboard.allBookings} →</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#ECFEFF" }}>
                <svg className="w-6 h-6" fill="none" stroke="#0E7490" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">{c.dashboard.noBookings}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recent.map(b => (
                <li key={b.id}
                  onClick={() => router.push(`/dashboard/checkin/bookings`)}
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
                      style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                      {b.guest_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{b.guest_name}</p>
                      <p className="text-xs text-slate-400 font-medium">{b.check_in_date} → {b.check_out_date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex-shrink-0 ${STATUS_COLORS[b.status] ?? ""}`}>
                    {statusLabel(b.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
