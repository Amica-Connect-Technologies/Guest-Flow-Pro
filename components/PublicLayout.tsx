"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

const languages = [
  { code: "EN", label: "English", flag: "🇬🇧" },
  { code: "IT", label: "Italiano", flag: "🇮🇹" },
];

type Lang = (typeof languages)[number];

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Dashboard and admin have their own full headers — skip everything
  const isDashAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

  // Hotel guest pages and auth pages get the branded header but no footer/bottom-nav
  const isHotelPage = pathname.startsWith("/h/");
  const isAuthPage  =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const showHeader = !isDashAdmin;
  const showFooter = !isDashAdmin && !isHotelPage && !isAuthPage;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>(languages[0]);

  return (
    <>
      {showHeader && (
        <>
          <div className="hidden md:block">
            <Navbar />
          </div>
          <MobileHeader activeLang={activeLang} onLangClick={() => setSheetOpen(true)} />
        </>
      )}

      <main className={showHeader ? `flex-1 pt-14 md:pt-16${showFooter ? " pb-20 md:pb-0" : ""}` : "flex-1"}>
        {children}
      </main>

      {showFooter && (
        <>
          <div className="hidden md:block">
            <Footer />
          </div>
          <BottomNav />
        </>
      )}

      {/* ── Language Sheet — rendered at PublicLayout root, no stacking-context parent ── */}
      {showHeader && sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 9998,
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: "white",
              borderRadius: "24px 24px 0 0",
              paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <p className="text-sm font-bold text-slate-900 text-center pb-3 border-b border-slate-100">
              Select Language
            </p>

            <div className="px-4 pt-3 space-y-2">
              {languages.map((lang) => {
                const active = activeLang.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    style={{ touchAction: "manipulation" }}
                    onClick={() => {
                      setActiveLang(lang);
                      setSheetOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-colors ${
                      active
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <span className="text-3xl leading-none">{lang.flag}</span>
                    <div className="text-left flex-1">
                      <p
                        className={`font-bold text-base ${
                          active ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {lang.label}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">{lang.code}</p>
                    </div>
                    {active && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth={3}
                          className="w-3.5 h-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
