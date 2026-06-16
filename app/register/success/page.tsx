"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { registrationsApi } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

// ── Manual payment success (bank transfer / invoice) ─────────────────────────
function ManualSuccess({ businessName, method, plan }: { businessName: string; method: string; plan: string }) {
  const { t } = useLanguage();
  const NEXT_STEPS = [t.registerFlow.step1, t.registerFlow.step2, t.registerFlow.step3, t.registerFlow.step4];
  const isBank = method === "bank_transfer";
  const planLabel = plan === "pro" ? t.registerFlow.planPro : t.registerFlow.planBasic;

  return (
    <div>
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">{t.registerFlow.registrationReceived}</h1>
      {businessName && (
        <p className="text-slate-500 text-sm text-center mb-6">
          <span className="font-semibold text-slate-700">{businessName}</span> {t.registerFlow.pendingAdminReview}
        </p>
      )}

      {/* Payment instructions */}
      <div className={`rounded-2xl p-5 mb-5 border ${isBank ? "bg-blue-50 border-blue-100" : "bg-violet-50 border-violet-100"}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isBank ? "bg-blue-600" : "bg-violet-600"}`}>
            {isBank ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-bold ${isBank ? "text-blue-800" : "text-violet-800"}`}>
            {isBank ? t.registerFlow.bankTransferInstructions : t.registerFlow.invoiceDetails}
          </p>
        </div>

        {isBank ? (
          <div className="space-y-2">
            <p className="text-xs text-blue-700 mb-3">{t.registerFlow.bankEmailNotice}</p>
            {[
              { label: t.registerFlow.accountName, value: t.registerFlow.accountNameValue },
              { label: t.registerFlow.reference, value: businessName || t.registerFlow.yourBusinessName },
              { label: t.registerFlow.amount, value: planLabel },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center bg-white/60 rounded-xl px-3 py-2">
                <span className="text-xs text-blue-600 font-semibold">{label}</span>
                <span className="text-xs text-blue-900 font-bold">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-violet-700 mb-3">{t.registerFlow.invoiceEmailNotice}</p>
            {[
              { label: t.registerFlow.plan, value: planLabel },
              { label: t.registerFlow.dueWithin, value: t.registerFlow.sevenDays },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center bg-white/60 rounded-xl px-3 py-2">
                <span className="text-xs text-violet-600 font-semibold">{label}</span>
                <span className="text-xs text-violet-900 font-bold">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next steps */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t.registerFlow.whatHappensNext}</p>
        <div className="space-y-2.5">
          {NEXT_STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
              <span className="text-xs text-slate-600">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href="/login" className="block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm text-center transition-colors">
        {t.registerFlow.goToLogin}
      </Link>
    </div>
  );
}

// ── Stripe payment success ────────────────────────────────────────────────────
function StripeSuccess({ sessionId }: { sessionId: string }) {
  const { t } = useLanguage();
  const NEXT_STEPS = [t.registerFlow.step1, t.registerFlow.step2, t.registerFlow.step3, t.registerFlow.step4];
  const [st, setSt] = useState<"loading" | "ok" | "error">("loading");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    registrationsApi
      .verifyPayment(sessionId)
      .then((d) => { setBusinessName(d.business_name); setSt("ok"); })
      .catch(() => setSt("error"));
  }, [sessionId]);

  if (st === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">{t.registerFlow.confirmingPayment}</p>
      </div>
    );
  }

  if (st === "error") {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t.registerFlow.verificationFailed}</h2>
        <p className="text-slate-500 text-sm mb-6">{t.registerFlow.couldNotConfirm}</p>
        <Link href="/register" className="text-blue-600 text-sm font-semibold hover:underline">{t.registerFlow.tryAgain}</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">{t.registerFlow.paymentConfirmed}</h1>
      {businessName && (
        <p className="text-slate-500 text-sm text-center mb-6">
          <span className="font-semibold text-slate-700">{businessName}</span> {t.registerFlow.pendingAdminReview}
        </p>
      )}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t.registerFlow.whatHappensNext}</p>
        <div className="space-y-2.5">
          {NEXT_STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
              <span className="text-xs text-slate-600">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <Link href="/login" className="block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm text-center transition-colors">
        {t.registerFlow.goToLogin}
      </Link>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
function SuccessContent() {
  const { t } = useLanguage();
  const sp = useSearchParams();
  const method = sp.get("method");
  const sessionId = sp.get("session_id");
  const businessName = sp.get("business_name") ?? "";
  const plan = sp.get("plan") ?? "basic";

  if (method && method !== "stripe") {
    return <ManualSuccess businessName={businessName} method={method} plan={plan} />;
  }
  if (sessionId) {
    return <StripeSuccess sessionId={sessionId} />;
  }
  return (
    <div className="text-center py-8">
      <p className="text-slate-500 text-sm">{t.registerFlow.noRegistrationFound}</p>
      <Link href="/register" className="text-blue-600 text-sm font-semibold hover:underline mt-3 inline-block">{t.registerFlow.startRegistration}</Link>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 w-full max-w-md">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
