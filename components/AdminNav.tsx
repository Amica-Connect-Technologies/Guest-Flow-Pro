"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, registrationsApi } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

function Flag({ code, size = 16 }: { code: "en" | "it" | "es"; size?: number }) {
  const w = size, h = Math.round(size * 0.72);
  const common = { width: w, height: h, viewBox: "0 0 60 36", className: "rounded-[2px] flex-shrink-0", style: { boxShadow: "0 0 0 1px rgba(255,255,255,0.18)" } };
  if (code === "en") {
    return (
      <svg {...common}>
        <rect width="60" height="36" fill="#00247D" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" strokeWidth="7" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#CF142B" strokeWidth="2.4" />
        <path d="M30,0 V36 M0,18 H60" stroke="#fff" strokeWidth="11" />
        <path d="M30,0 V36 M0,18 H60" stroke="#CF142B" strokeWidth="6.5" />
      </svg>
    );
  }
  if (code === "it") {
    return (
      <svg {...common}>
        <rect width="20" height="36" fill="#009246" />
        <rect x="20" width="20" height="36" fill="#fff" />
        <rect x="40" width="20" height="36" fill="#CE2B37" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="60" height="36" fill="#C60B1E" />
      <rect y="9" width="60" height="18" fill="#FFC400" />
    </svg>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);

  const navItems = [
    {
      href: "/admin",
      label: t.adminNav.overview,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      href: "/admin/hotels",
      label: t.adminNav.hotels,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      href: "/admin/outreach",
      label: "Outreach",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      href: "/admin/tours",
      label: t.adminNav.tours,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/places",
      label: t.adminNav.places,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/registrations",
      label: t.adminNav.signups,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      label: t.adminNav.users,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    registrationsApi.pendingCount().then((d) => setPendingCount(d.count)).catch(() => {});
  }, [pathname]);

  function handleLogout() {
    auth.logout();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ══ DESKTOP SIDEBAR ══════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 z-40"
        style={{ background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", boxShadow: "0 4px 12px rgba(37,99,235,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold leading-none" style={{ color: "rgba(255,255,255,0.35)" }}>Amica International</p>
            <p className="text-sm font-black text-white leading-snug mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon }) => {
            const active = isActive(href);
            const isSignups = href === "/admin/registrations";
            return (
              <Link key={href} href={href}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  color: active ? "white" : "rgba(255,255,255,0.45)",
                  background: active ? "rgba(37,99,235,0.85)" : "transparent",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {icon}
                <span className="flex-1">{label}</span>
                {isSignups && pendingCount > 0 && (
                  <span className="text-[10px] font-black bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: language picker + view app + sign out */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          {/* Language picker */}
          <div className="flex gap-1 mb-2">
            {(["en", "it", "es"] as const).map((code) => {
              const LABEL = { en: "EN", it: "IT", es: "ES" } as const;
              return (
                <button key={code} onClick={() => setLang(code)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                  style={lang === code
                    ? { background: "rgba(37,99,235,0.3)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.4)" }
                    : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }
                  }>
                  <Flag code={code} />
                  {LABEL[code]}
                </button>
              );
            })}
          </div>
          <Link href="/hotels"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {t.adminNav.viewSite}
          </Link>
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLElement).style.color = "#F87171"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {t.adminNav.signOut}
          </button>
        </div>
      </aside>

      {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", zIndex: 200 }}>
        <div className="flex">
          {navItems.map(({ href, label, icon }) => {
            const active = isActive(href);
            const isSignups = href === "/admin/registrations";
            return (
              <Link key={href} href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-[58px] transition-all active:scale-90">
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-blue-500 rounded-b-full" />
                )}
                <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl ${active ? "text-blue-400" : "text-slate-500"}`}>
                  {icon}
                  {isSignups && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold leading-none ${active ? "text-blue-400" : "text-slate-500"}`}>{label}</span>
              </Link>
            );
          })}
          {/* Language toggle on mobile */}
          <button type="button"
            onClick={() => {
              const order = ["en", "it", "es"] as const;
              const next = order[(order.indexOf(lang as "en" | "it" | "es") + 1) % order.length];
              setLang(next);
            }}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-[58px] active:scale-90">
            <div className="flex items-center justify-center w-10 h-7 rounded-xl text-slate-400">
              <Flag code={(lang as "en" | "it" | "es") ?? "en"} size={20} />
            </div>
            <span className="text-[10px] font-bold leading-none text-slate-500 uppercase">{lang}</span>
          </button>
          <button type="button" onClick={handleLogout}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-[58px] active:scale-90">
            <div className="flex items-center justify-center w-10 h-7 rounded-xl text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <span className="text-[10px] font-bold leading-none text-slate-500">{t.adminNav.signOut}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
