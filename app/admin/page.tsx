"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, hotelsApi, type Hotel } from "@/lib/api";

export default function AdminOverview() {
  const router = useRouter();
  const [counts, setCounts] = useState({ hotels: 0, tours: 0, places: 0 });
  const [recentHotels, setRecentHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = await auth.me();
        setUserEmail(user.email);
      } catch {
        router.push("/login");
        return;
      }
      try {
        const [stats, hotels] = await Promise.all([
          hotelsApi.stats(),
          hotelsApi.list(),
        ]);
        setCounts(stats);
        setRecentHotels(hotels.slice(0, 5));
      } catch { /* continue with defaults */ }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Hotels",
      value: counts.hotels,
      href: "/admin/hotels",
      bg: "bg-blue-600",
      light: "bg-blue-50 text-blue-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      label: "Tours",
      value: counts.tours,
      href: "/admin/tours",
      bg: "bg-emerald-600",
      light: "bg-emerald-50 text-emerald-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      label: "Places",
      value: counts.places,
      href: "/admin/places",
      bg: "bg-violet-600",
      light: "bg-violet-50 text-violet-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { href: "/admin/hotels", label: "Manage Hotels", desc: "Add & edit partner hotels", dot: "bg-blue-600" },
    { href: "/admin/tours", label: "Manage Tours", desc: "Tour packages & affiliate links", dot: "bg-emerald-600" },
    { href: "/admin/places", label: "Manage Places", desc: "Restaurants, attractions & more", dot: "bg-violet-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)", paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-medium text-slate-400 leading-none tracking-wide">Amica International</p>
              <p className="font-bold text-slate-900 text-sm leading-none">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/hotels"
              className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl"
            >
              View App
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="px-4 pt-5 pb-28 space-y-5">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-2 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <p className="text-blue-200 text-xs font-medium mb-1">Logged in as</p>
            <p className="text-white font-bold text-sm truncate">{userEmail}</p>
            <p className="text-blue-200 text-xs mt-2">Digital Concierge · Super Admin</p>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Content Overview</p>
          <div className="grid grid-cols-3 gap-3">
            {statCards.map(({ label, value, href, bg, icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 active:scale-95 transition-transform"
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2.5 shadow-sm`}>
                  {icon}
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
          <div className="space-y-2.5">
            {quickLinks.map(({ href, label, desc, dot }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.99] transition-transform"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-300 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Hotels */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Hotels</p>
            <Link href="/admin/hotels" className="text-xs font-bold text-blue-600">See all →</Link>
          </div>
          {recentHotels.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <p className="text-slate-400 text-sm">No hotels added yet.</p>
              <Link href="/admin/hotels" className="inline-block mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                Add First Hotel
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {hotel.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{hotel.name}</p>
                    <p className="text-xs text-slate-400">{hotel.city}</p>
                  </div>
                  <p className="text-xs text-slate-300 flex-shrink-0">
                    {new Date(hotel.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
