"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { clearSession } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { lang, t, setLang } = useLanguage();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("access"));
  }, [pathname]);

  const links = [
    { href: "/hotels",     label: t.nav.hotels },
    { href: "/tours",      label: t.nav.tours  },
    { href: "/places",     label: t.nav.places },
    { href: "/for-hotels", label: "For Hotels", highlight: true },
  ];

  function handleSignOut() {
    clearSession();
    setLoggedIn(false);
    router.push("/");
    setMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: 76 }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="GuestFlow Pro"
            width={240}
            height={68}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-8 items-center text-sm font-medium">
          {links.map(({ href, label, highlight }) => (
            <li key={href}>
              {highlight ? (
                <Link
                  href={href}
                  className="bg-gradient-to-r from-cyan-700 to-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {label}
                </Link>
              ) : (
                <Link
                  href={href}
                  className={`relative pb-1 transition-colors duration-200 hover:text-blue-600 after:absolute after:left-0 after:bottom-0 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-200 ${
                    pathname === href
                      ? "text-blue-600 after:w-full"
                      : "text-slate-600 after:w-0 hover:after:w-full"
                  }`}
                >
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Right side: language + account */}
        <div className="flex items-center gap-3">

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLang("en")}
              title="English"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-base leading-none">🇬🇧</span>
              <span className="hidden sm:inline">EN</span>
            </button>
            <button
              onClick={() => setLang("it")}
              title="Italiano"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "it" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-base leading-none">🇮🇹</span>
              <span className="hidden sm:inline">IT</span>
            </button>
            <button
              onClick={() => setLang("es")}
              title="Español"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "es" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-base leading-none">🇪🇸</span>
              <span className="hidden sm:inline">ES</span>
            </button>
          </div>

          {/* Account button — desktop only */}
          {loggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-700 to-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden md:block text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors px-2 py-2"
              >
                {t.adminNav.signOut}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 border-2 border-cyan-700 text-cyan-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-cyan-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {t.login?.signIn ?? "Login"}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-700 focus:outline-none p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 pb-5 shadow-lg">
          <ul className="flex flex-col gap-4 pt-4 text-sm font-medium">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`block transition-colors hover:text-blue-600 ${
                    pathname === href ? "text-blue-600 font-semibold" : "text-slate-700"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* Account section in mobile menu */}
            <li className="pt-2 border-t border-slate-100">
              {loggedIn ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 font-bold text-cyan-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 font-semibold text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    {t.adminNav.signOut}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 font-bold text-cyan-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {t.login?.signIn ?? "Login"}
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
