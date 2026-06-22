"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, checkinApi, CheckinBooking, CheckinStats } from "@/lib/api";
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

  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [recent, setRecent] = useState<CheckinBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    auth.me()
      .then(() =>
        Promise.all([
          checkinApi.stats(),
          checkinApi.listBookings({ filter: "today" }),
        ])
      )
      .then(([s, bookings]) => {
        setStats(s);
        setRecent(bookings.slice(0, 5));
      })
      .catch(err => {
        if (err.message?.includes("401") || err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("authentication")) {
          router.replace("/login");
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const statusLabel = (s: string) =>
    (c.status as Record<string, string>)[s] ?? s;

  return (
    <div className="min-h-screen bg-[#ECEEF3]">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
        <button onClick={() => router.back()} className="text-cyan-700 text-sm font-semibold mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">{c.navLabel}</p>
        <h1 className="text-xl font-bold text-slate-900">{c.dashboard.title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{c.dashboard.subtitle}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/checkin/new"
            className="bg-gradient-to-br from-cyan-700 to-cyan-600 text-white rounded-2xl p-4 text-center shadow-sm"
          >
            <div className="text-2xl mb-1">＋</div>
            <p className="text-sm font-bold">{c.dashboard.newBooking}</p>
          </Link>
          <Link
            href="/dashboard/checkin/bookings"
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100"
          >
            <div className="text-2xl mb-1">📋</div>
            <p className="text-sm font-bold text-slate-700">{c.dashboard.allBookings}</p>
          </Link>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3">
            {([
              ["today",     "🛬", c.dashboard.cards.today,     "text-cyan-700",    "bg-cyan-50"],
              ["tomorrow",  "📅", c.dashboard.cards.tomorrow,  "text-indigo-700",  "bg-indigo-50"],
              ["pending",   "⏳", c.dashboard.cards.pending,   "text-amber-700",   "bg-amber-50"],
              ["completed", "✅", c.dashboard.cards.completed,  "text-emerald-700", "bg-emerald-50"],
              ["missing",   "⚠️", c.dashboard.cards.missing,   "text-red-700",     "bg-red-50"],
              ["total",     "📊", c.dashboard.cards.total,     "text-slate-700",   "bg-slate-50"],
            ] as [keyof CheckinStats, string, string, string, string][]).map(([key, icon, label, textCls, bgCls]) => (
              <div key={key} className={`${bgCls} rounded-2xl p-4 shadow-sm`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{icon}</span>
                  <span className={`text-2xl font-bold ${textCls}`}>{stats[key]}</span>
                </div>
                <p className="text-xs font-semibold text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Today's arrivals */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">{c.dashboard.recentArrivals}</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">{c.dashboard.noBookings}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recent.map(b => (
                <li key={b.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{b.guest_name}</p>
                    <p className="text-xs text-slate-400">{b.check_in_date} → {b.check_out_date}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                    {statusLabel(b.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-slate-50">
            <Link href="/dashboard/checkin/bookings" className="text-xs font-semibold text-cyan-700">
              {c.dashboard.allBookings} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
