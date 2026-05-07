"use client";

import Link from "next/link";

interface Lang {
  code: string;
  label: string;
  flag: string;
}

interface MobileHeaderProps {
  activeLang: Lang;
  onLangClick: () => void;
}

export default function MobileHeader({ activeLang, onLangClick }: MobileHeaderProps) {
  return (
    <header
      className="md:hidden fixed top-0 inset-x-0 bg-white border-b border-slate-100"
      style={{ zIndex: 500, boxShadow: "0 1px 16px rgba(0,0,0,0.07)" }}
    >
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Logo */}
        <Link href="/hotels" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2.2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-[10px] font-medium text-slate-400 leading-none mb-0.5 tracking-wide">
              Amica International
            </p>
            <p className="font-bold text-slate-900 text-sm leading-none">
              Digital <span className="text-blue-600">Concierge</span>
            </p>
          </div>
        </Link>

        {/* Language Button */}
        <button
          type="button"
          onClick={onLangClick}
          style={{ touchAction: "manipulation", cursor: "pointer" }}
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 active:bg-slate-100"
        >
          <span className="text-base leading-none">{activeLang.flag}</span>
          <span className="text-xs font-bold text-slate-700">{activeLang.code}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-3 h-3 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
