"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function CheckinSuccessPage() {
  const { t } = useLanguage();
  const c = t.checkin.guestForm.success;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-700 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{c.title}</h1>
        <p className="text-slate-600 leading-relaxed mb-8">{c.message}</p>

        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-md"
        >
          {c.backHome}
        </Link>
      </div>
    </div>
  );
}
