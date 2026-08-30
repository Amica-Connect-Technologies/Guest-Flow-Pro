"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, QrCode, ClipboardCheck, Users, MessageCircle,
  Star, Mail, KeyRound, Images, Bell, ClipboardList, User, LogOut,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { auth, hotelsApi, type Hotel } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import Flag from "@/components/Flag";

const NAV_T = {
  en: {
    dashboard: "Dashboard", checkin: "Guest Check-in",
    guests: "Guest CRM", requests: "Direct Enquiries",
    reviews: "Reviews", marketing: "Marketing", apiKeys: "API Keys",
    overview: "Overview", qrCode: "QR Code", gallery: "Gallery",
    services: "Services", bookings: "Service Bookings", profile: "Hotel Profile",
    newBooking: "New Check-in", allBookings: "All Check-ins",
    signOut: "Sign Out",
  },
  it: {
    dashboard: "Dashboard", checkin: "Check-in Ospiti",
    guests: "CRM Ospiti", requests: "Richieste Dirette",
    reviews: "Recensioni", marketing: "Marketing", apiKeys: "Chiavi API",
    overview: "Panoramica", qrCode: "QR Code", gallery: "Galleria",
    services: "Servizi", bookings: "Prenotazioni Servizi", profile: "Profilo Hotel",
    newBooking: "Nuovo Check-in", allBookings: "Tutti i Check-in",
    signOut: "Esci",
  },
  es: {
    dashboard: "Dashboard", checkin: "Check-in Huéspedes",
    guests: "CRM Huéspedes", requests: "Consultas Directas",
    reviews: "Reseñas", marketing: "Marketing", apiKeys: "Claves API",
    overview: "Resumen", qrCode: "QR Code", gallery: "Galería",
    services: "Servicios", bookings: "Reservas de Servicios", profile: "Perfil Hotel",
    newBooking: "Nuevo Check-in", allBookings: "Todos los Check-ins",
    signOut: "Cerrar Sesión",
  },
} as const;

type SubTab = { label: string; href: string };
type NavItem = {
  key: string;
  label: string;
  Icon: React.ElementType;
  href: string;
  subtabs?: SubTab[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { lang, setLang } = useLanguage();
  const nt           = NAV_T[lang as keyof typeof NAV_T] ?? NAV_T.en;

  const [hotel,     setHotel]     = useState<Hotel | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const plan = hotel?.plan ?? "";
  const IS_LEGACY     = ["starter", "basic", "pro"].includes(plan);
  const HAS_CONCIERGE = IS_LEGACY || ["concierge", "concierge_checkin", "full"].includes(plan);
  const HAS_CHECKIN   = IS_LEGACY || ["checkin", "concierge_checkin", "full"].includes(plan);
  const HAS_FULL      = IS_LEGACY || plan === "full";

  const PLAN_LABEL: Record<string, string> = {
    concierge:         "Digital Concierge · £25/mo",
    checkin:           "Smart Check-in · £50/mo",
    concierge_checkin: "Guest Experience Pro · £75/mo",
    full:              "Full Suite · £100/mo",
    starter:           "Starter (Legacy)",
    basic:             "Basic (Legacy) · £29/mo",
    pro:               "Pro (Legacy) · £79/mo",
  };

  // Plan timeline calculations — use created_at as cycle base when plan_expires_at is null
  const planNow         = new Date();
  const PLAN_PERIOD     = hotel?.is_trial ? 14 : 30;
  const planCreatedAt   = hotel?.created_at ? new Date(hotel.created_at) : null;
  const planExplicit    = hotel?.plan_expires_at ? new Date(hotel.plan_expires_at) : null;

  let planExpiresAt: Date | null = null;
  let planPeriodStart: Date | null = null;
  if (planExplicit) {
    planExpiresAt  = planExplicit;
    planPeriodStart = new Date(planExplicit.getTime() - PLAN_PERIOD * 86400000);
  } else if (planCreatedAt) {
    const daysSince = Math.max(0, Math.floor((planNow.getTime() - planCreatedAt.getTime()) / 86400000));
    const cycleNum  = Math.floor(daysSince / PLAN_PERIOD);
    planPeriodStart = new Date(planCreatedAt.getTime() + cycleNum * PLAN_PERIOD * 86400000);
    planExpiresAt   = new Date(planCreatedAt.getTime() + (cycleNum + 1) * PLAN_PERIOD * 86400000);
  }

  const planDaysLeft  = planExpiresAt ? Math.max(0, Math.floor((planExpiresAt.getTime() - planNow.getTime()) / 86400000)) : null;
  const planDaysUsed  = planPeriodStart ? Math.max(0, Math.floor((planNow.getTime() - planPeriodStart.getTime()) / 86400000)) : 0;
  const planProgress  = Math.min(100, Math.round((planDaysUsed / PLAN_PERIOD) * 100));
  const planWarn      = planDaysLeft !== null && planDaysLeft <= 5;
  const planExpired   = planDaysLeft === 0 && planExpiresAt !== null && planNow > planExpiresAt;

  const NAV: NavItem[] = [
    {
      key: "dashboard", label: nt.dashboard, Icon: LayoutDashboard, href: "/dashboard",
      subtabs: [
        { label: nt.overview,  href: "/dashboard" },
        { label: nt.gallery,   href: "/dashboard?tab=gallery" },
        { label: nt.services,  href: "/dashboard?tab=services" },
        ...(HAS_CONCIERGE ? [
          { label: nt.qrCode,   href: "/dashboard?tab=qr" },
          { label: nt.bookings, href: "/dashboard?tab=bookings" },
        ] : []),
        { label: nt.profile,   href: "/dashboard?tab=profile" },
      ],
    },
    ...(HAS_CHECKIN ? [{
      key: "checkin", label: nt.checkin, Icon: ClipboardCheck, href: "/dashboard/checkin",
      subtabs: [
        { label: nt.overview,    href: "/dashboard/checkin" },
        { label: nt.newBooking,  href: "/dashboard/checkin/new" },
        { label: nt.allBookings, href: "/dashboard/checkin/bookings" },
      ],
    }] : []),
    { key: "requests", label: nt.requests, Icon: MessageCircle, href: "/dashboard/requests" },
    ...(HAS_FULL      ? [{ key: "reviews",   label: nt.reviews,   Icon: Star,          href: "/dashboard/reviews"   }] : []),
    ...(HAS_FULL      ? [{ key: "marketing", label: nt.marketing, Icon: Mail,          href: "/dashboard/marketing" }] : []),
    ...(HAS_FULL      ? [{ key: "api-keys",  label: nt.apiKeys,   Icon: KeyRound,      href: "/dashboard/api-keys"  }] : []),
  ];

  // Load hotel data once
  useEffect(() => {
    auth.me()
      .then(u => { setUserEmail(u.email ?? ""); return hotelsApi.get(u.hotel_id ?? ""); })
      .then(h => setHotel(h))
      .catch(() => router.replace("/login"));
  }, [router]);

  // Auto-expand the active parent on pathname change
  useEffect(() => {
    for (const item of NAV) {
      if (!item.subtabs) continue;
      // base path match (ignore search params)
      const base = pathname;
      if (item.subtabs.some(s => base === s.href.split("?")[0] || base.startsWith(s.href.split("?")[0] + "/"))) {
        setExpanded(item.key);
        return;
      }
    }
  }, [pathname]);

  function isParentActive(item: NavItem): boolean {
    if (!item.subtabs) return pathname === item.href || pathname.startsWith(item.href + "/");
    return item.subtabs.some(s => pathname === s.href.split("?")[0] || pathname.startsWith(s.href.split("?")[0] + "/"));
  }

  function isSubActive(sub: SubTab): boolean {
    const [subBase, subQuery] = sub.href.split("?");
    if (pathname !== subBase) return false;
    if (!subQuery) {
      // "Overview" — active only when no ?tab= param is set
      return !searchParams.get("tab");
    }
    // Tab-based sub — match the ?tab= param
    const subTab = new URLSearchParams(subQuery).get("tab");
    return searchParams.get("tab") === subTab;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP SIDEBAR (fixed, hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-40"
        style={{
          background: "linear-gradient(180deg, #020B12 0%, #0c3344 100%)",
          borderRight: "1px solid rgba(6,182,212,0.12)",
        }}
      >
        {/* Hotel identity */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
          {hotel?.logo_url ? (
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-0.5 rounded-xl opacity-60"
                style={{ background: "linear-gradient(135deg, #F59E0B, #06B6D4)" }} />
              <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={40} height={40}
                className="relative w-10 h-10 rounded-xl object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #083344, #0E7490)", border: "1.5px solid rgba(6,182,212,0.4)" }}>
              {hotel?.name?.slice(0, 2).toUpperCase() ?? "HT"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{hotel?.name ?? ""}</p>
            <p className="text-cyan-300/70 text-xs mt-0.5 font-medium truncate">{hotel?.city ?? ""}</p>
            {plan && PLAN_LABEL[plan] && (
              <p className="text-cyan-400/55 text-[10px] mt-0.5 font-semibold truncate">{PLAN_LABEL[plan]}</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV.map(item => {
            const parentActive = isParentActive(item);
            const isOpen       = expanded === item.key;

            return (
              <div key={item.key} className="mb-0.5">
                <button
                  onClick={() => {
                    if (item.subtabs) {
                      setExpanded(isOpen ? null : item.key);
                    }
                    router.push(item.href);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                    parentActive ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                  style={parentActive ? { background: "rgba(255,255,255,0.14)" } : {}}
                  onMouseEnter={e => { if (!parentActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!parentActive) (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <item.Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.subtabs && (
                    isOpen
                      ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                  )}
                </button>

                {/* Sub-tabs */}
                {item.subtabs && isOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l space-y-0.5 mb-1"
                    style={{ borderColor: "rgba(6,182,212,0.18)" }}>
                    {item.subtabs.map(sub => {
                      const subActive = isSubActive(sub);
                      return (
                        <button
                          key={sub.href}
                          onClick={() => router.push(sub.href)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            subActive
                              ? "text-cyan-300 bg-white/10"
                              : "text-white/45 hover:text-white/80 hover:bg-white/5"
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Plan timeline */}
        {plan && (
          <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
            <div className="px-3 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {hotel?.is_trial ? "Free Trial" : "Subscription"}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: planExpired ? "rgba(239,68,68,0.18)" : planWarn ? "rgba(245,158,11,0.18)" : "rgba(52,211,153,0.15)",
                    color:      planExpired ? "#f87171"               : planWarn ? "#fbbf24"               : "#34d399",
                  }}>
                  {planExpired ? "Expired" : planDaysLeft !== null ? `${planDaysLeft}d left` : "Active"}
                </span>
              </div>

              {/* Progress bar — only when expiry exists */}
              {planExpiresAt ? (
                <>
                  <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${planProgress}%`,
                      background: planExpired
                        ? "#ef4444"
                        : planWarn
                        ? "linear-gradient(90deg, #F59E0B, #ef4444)"
                        : "linear-gradient(90deg, #06B6D4, #0E7490)",
                    }} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.28)" }}>
                      {planDaysUsed}d used · {PLAN_PERIOD}d total
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-2 rounded-full mb-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full w-full rounded-full" style={{ background: "linear-gradient(90deg, #06B6D4, #0E7490)", opacity: 0.5 }} />
                </div>
              )}

              {/* Renewal date */}
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {planExpiresAt ? (
                    <>{planExpired ? "Expired" : hotel?.is_trial ? "Trial ends" : "Renews"}{" "}
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      {planExpiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span></>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>No expiry set</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 flex-shrink-0">
          <p className="px-3 pb-2 text-white/35 text-[11px] font-medium truncate">{userEmail}</p>

          <button
            onClick={() => { auth.logout(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-all"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.cssText += "color:#f87171;background:rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.cssText = "color:rgba(255,255,255,0.5);background:transparent"; }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {nt.signOut}
          </button>
        </div>
      </aside>

      {/* Main area — offset right of sidebar on desktop */}
      <div className="md:pl-64">
        {/* Mobile top bar (dashboard has no mobile sidebar) */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: "linear-gradient(180deg, #020B12 0%, #0c3344 100%)", borderColor: "rgba(6,182,212,0.12)" }}>
          <div className="flex items-center gap-2 min-w-0">
            {hotel?.logo_url ? (
              <Image unoptimized src={hotel.logo_url} alt={hotel.name ?? ""} width={28} height={28}
                className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                {hotel?.name?.slice(0, 2).toUpperCase() ?? "HT"}
              </div>
            )}
            <span className="text-white font-bold text-sm truncate">{hotel?.name ?? "Dashboard"}</span>
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-3">
            {(["en", "it", "es"] as const).map((code) => {
              return (
                <button key={code} onClick={() => setLang(code)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={lang === code
                    ? { background: "rgba(6,182,212,0.25)", border: "1px solid rgba(6,182,212,0.4)" }
                    : { opacity: 0.45, border: "1px solid transparent" }
                  }>
                  <Flag code={code} size={20} />
                </button>
              );
            })}
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
