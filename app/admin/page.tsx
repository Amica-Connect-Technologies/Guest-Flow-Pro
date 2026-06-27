"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, hotelsApi, type Hotel } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

export default function AdminOverview() {
  const router = useRouter();
  const { t } = useLanguage();
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
        setRecentHotels(hotels.slice(0, 6));
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
          <p className="text-sm text-slate-400">{t.adminOverview.loading}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: t.adminOverview.hotels,
      value: counts.hotels,
      href: "/admin/hotels",
      gradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
      shadow: "rgba(37,99,235,0.30)",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      desc: "Partner properties",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      label: t.adminOverview.tours,
      value: counts.tours,
      href: "/admin/tours",
      gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      shadow: "rgba(5,150,105,0.28)",
      iconBg: "#ECFDF5",
      iconColor: "#059669",
      desc: "Tour packages listed",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      label: t.adminOverview.places,
      value: counts.places,
      href: "/admin/places",
      gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
      shadow: "rgba(124,58,237,0.28)",
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      desc: "Points of interest",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    {
      href: "/admin/hotels",
      label: t.adminOverview.manageHotels,
      desc: t.adminOverview.manageHotelsDesc,
      color: "#2563EB",
      bg: "#EFF6FF",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      href: "/admin/tours",
      label: t.adminOverview.manageTours,
      desc: t.adminOverview.manageToursDesc,
      color: "#059669",
      bg: "#ECFDF5",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/places",
      label: t.adminOverview.managePlaces,
      desc: t.adminOverview.managePlacesDesc,
      color: "#7C3AED",
      bg: "#F5F3FF",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/registrations",
      label: t.adminNav.signups,
      desc: "Review hotel sign-up requests",
      color: "#D97706",
      bg: "#FFFBEB",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      label: t.adminNav.users,
      desc: "Manage admin accounts",
      color: "#0891B2",
      bg: "#ECFEFF",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar (mobile only — desktop has sidebar branding) ──────── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-medium text-slate-400 tracking-wide">{t.adminOverview.brandLine}</p>
              <p className="font-bold text-slate-900 text-sm">{t.adminOverview.panelTitle}</p>
            </div>
          </div>
          <Link href="/hotels" className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            {t.adminOverview.viewApp}
          </Link>
        </div>
      </div>

      {/* ── Desktop page header ──────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Dashboard</p>
          <h1 className="text-2xl font-black text-slate-900">{t.adminOverview.contentOverview}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold">{t.adminOverview.loggedInAs}</p>
            <p className="text-sm font-black text-slate-800">{userEmail}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
            {userEmail.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-28 md:pb-10 space-y-6">

        {/* Welcome banner */}
        <div className="rounded-3xl p-5 md:p-7 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute -bottom-10 right-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold mb-1">{t.adminOverview.loggedInAs}</p>
              <p className="text-white font-black text-lg md:text-xl">{userEmail}</p>
              <p className="text-blue-200 text-sm mt-1">{t.adminOverview.roleLine}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/hotels"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                {t.adminOverview.viewApp}
              </Link>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">{t.adminOverview.contentOverview}</p>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {statCards.map(({ label, value, href, gradient, shadow, iconBg, iconColor, desc, icon }) => (
              <Link key={label} href={href}
                className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 group"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "block" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${shadow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
                }}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 flex-shrink-0"
                  style={{ background: iconBg, color: iconColor }}>
                  {icon}
                </div>
                <p className="text-3xl md:text-4xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-xs md:text-sm font-bold text-slate-500 mt-1.5">{label}</p>
                <p className="hidden md:block text-[11px] text-slate-400 mt-1">{desc}</p>
                <div className="hidden md:flex items-center gap-1 mt-4 text-xs font-black" style={{ color: iconColor }}>
                  Manage <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop 2-col: quick actions + recent hotels */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">

          {/* Quick actions */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">{t.adminOverview.quickActions}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map(({ href, label, desc, color, bg, icon }) => (
                <Link key={href} href={href}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 group transition-all"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, color }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-300 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent hotels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.adminOverview.recentHotels}</p>
              <Link href="/admin/hotels" className="text-xs font-black text-blue-600 hover:underline">{t.adminOverview.seeAll}</Link>
            </div>

            {recentHotels.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-slate-400 text-sm">{t.adminOverview.noHotelsYet}</p>
                <Link href="/admin/hotels"
                  className="inline-block mt-3 text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                  {t.adminOverview.addFirstHotel}
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                {recentHotels.map((hotel, i) => (
                  <Link key={hotel.id} href={`/admin/hotels`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: i < recentHotels.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div className="w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      {hotel.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{hotel.name}</p>
                      <p className="text-xs text-slate-400">{hotel.city}</p>
                    </div>
                    <p className="text-xs text-slate-300 flex-shrink-0 font-semibold">
                      {new Date(hotel.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
