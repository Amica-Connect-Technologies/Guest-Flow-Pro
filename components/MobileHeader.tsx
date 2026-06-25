"use client";

import Link from "next/link";
import Image from "next/image";

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
        style={{ height: 76, paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="GuestFlow Pro"
            width={220}
            height={64}
            className="h-14 w-auto object-contain"
            priority
          />
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
