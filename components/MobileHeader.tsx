"use client";

import Link from "next/link";

export default function MobileHeader() {
  return (
    <header
      className="md:hidden fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="leading-none">
            <span className="font-serif text-base font-bold text-slate-900">Guest Flow</span>
            <span className="text-blue-600 font-bold text-base ml-0.5">Pro</span>
          </div>
        </Link>

        {/* Book Now CTA */}
        <Link
          href="/contact"
          className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform"
        >
          Book Now
        </Link>
      </div>
    </header>
  );
}
