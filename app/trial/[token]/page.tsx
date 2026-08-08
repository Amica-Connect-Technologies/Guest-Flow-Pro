"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { outreachApi } from "@/lib/api";

type Info = { hotel_name: string; contact_name: string; email: string; city: string };

export default function TrialActivatePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo]     = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState("");
  const [done,  setDone]    = useState(false);

  useEffect(() => {
    outreachApi.getTrialInfo(token)
      .then(setInfo)
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await outreachApi.activateTrial(token, password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#020B12 0%,#083344 55%,#0E7490 100%)" }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-cyan-400 animate-spin" />
    </div>
  );

  if (invalid) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "linear-gradient(135deg,#020B12 0%,#083344 100%)" }}>
      <p className="text-5xl mb-4">🔗</p>
      <h1 className="text-white font-black text-2xl mb-2">Invalid or expired link</h1>
      <p className="text-slate-400 text-sm">This trial invitation link is not valid. Please contact us for help.</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "linear-gradient(135deg,#020B12 0%,#083344 55%,#0E7490 100%)" }}>
      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.5} className="w-12 h-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-white font-black text-3xl mb-2">Trial Activated!</h1>
      <p className="text-slate-300 text-base mb-1">
        Welcome, <strong className="text-white">{info?.hotel_name}</strong>
      </p>
      <p className="text-slate-400 text-sm max-w-xs mb-8">
        Your 14-day free trial is active. Log in now to explore your dashboard.
      </p>
      <button onClick={() => router.push("/login")}
        className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm transition-all"
        style={{ background: "linear-gradient(135deg,#0891B2,#0E7490)", boxShadow: "0 8px 24px rgba(8,145,178,0.35)" }}>
        Go to Login →
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-16"
      style={{ background: "linear-gradient(135deg,#020B12 0%,#083344 55%,#0E7490 100%)" }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[2px] text-cyan-400/80 mb-3">GuestFlow Pro</p>
        <h1 className="text-white font-black text-2xl mb-1">Activate Your Free Trial</h1>
        <p className="text-slate-400 text-sm">14 days · No credit card · Cancel anytime</p>
      </div>

      <div className="max-w-md mx-auto px-5">
        {/* Hotel info card */}
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0891B2,#0E7490)" }}>
            {info!.hotel_name.slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-black text-sm">{info!.hotel_name}</p>
            <p className="text-slate-400 text-xs">{info!.email}{info!.city ? ` · ${info!.city}` : ""}</p>
          </div>
          <div className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            14 days free
          </div>
        </div>

        {/* Features */}
        <div className="rounded-2xl p-4 mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Included in your trial</p>
          {[
            "Smart digital check-in for guests",
            "Digital concierge — services, tours & more",
            "Branded QR code for your hotel",
            "Guest database & communication",
            "Review management",
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 mb-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={3} className="w-2.5 h-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p className="text-sm text-slate-300">{f}</p>
            </div>
          ))}
        </div>

        {/* Password form */}
        <form onSubmit={activate} className="space-y-3">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Create Password
            </label>
            <input
              type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              placeholder="At least 8 characters"
              className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-600"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <input
              type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
              placeholder="Same password again"
              className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-600"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting || !password || !confirm}
            className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#0891B2,#0E7490)",
              boxShadow: "0 8px 28px rgba(8,145,178,0.35)",
            }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Activating…
              </span>
            ) : "Activate 14-Day Free Trial →"}
          </button>
          <p className="text-center text-xs text-slate-600 pb-2">
            No credit card required · Cancel anytime
          </p>
        </form>
      </div>
    </div>
  );
}
