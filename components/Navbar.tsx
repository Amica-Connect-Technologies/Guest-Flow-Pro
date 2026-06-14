"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, t, setLang } = useLanguage();

  const links = [
    { href: "/hotels", label: t.nav.hotels },
    { href: "/tours", label: t.nav.tours },
    { href: "/places", label: t.nav.places },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <div className="leading-none">
            <span className="font-serif text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
              Guest Flow
            </span>
            <span className="hidden sm:inline text-blue-600 font-semibold text-sm ml-1">
              Pro
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-8 items-center text-sm font-medium">
          {links.map(({ href, label }) => (
            <li key={href}>
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
            </li>
          ))}
        </ul>

        {/* Language toggle + mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLang("en")}
              title="English"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-base leading-none">🇬🇧</span>
              <span className="hidden sm:inline">EN</span>
            </button>
            <button
              onClick={() => setLang("it")}
              title="Italiano"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                lang === "it"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-base leading-none">🇮🇹</span>
              <span className="hidden sm:inline">IT</span>
            </button>
          </div>

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
          </ul>
        </div>
      )}
    </nav>
  );
}
