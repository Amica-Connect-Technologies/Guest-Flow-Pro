"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkinApi, type CheckinBooking } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type FormState = {
  guest_name: string; guest_email: string; guest_phone: string;
  check_in_date: string; check_out_date: string; num_guests: string;
  booking_reference: string; notes: string;
};
const EMPTY: FormState = {
  guest_name: "", guest_email: "", guest_phone: "",
  check_in_date: "", check_out_date: "", num_guests: "1",
  booking_reference: "", notes: "",
};

export default function NewBookingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const c = t.checkin.newBooking;

  const [form, setForm]         = useState<FormState>(EMPTY);
  const [errors, setErrors]     = useState<Partial<Record<keyof FormState, string>>>({});
  const [creating, setCreating] = useState(false);
  const [booking, setBooking]   = useState<CheckinBooking | null>(null);
  const [copied, setCopied]     = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus]   = useState<"" | "sent" | "failed">("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!token) router.replace("/login");
  }, [router]);

  function setField(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const e = { ...prev }; delete e[k]; return e; });
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.guest_name.trim()) errs.guest_name = "Required";
    if (!form.check_in_date) errs.check_in_date = "Required";
    if (!form.check_out_date) errs.check_out_date = "Required";
    if (form.check_in_date && form.check_out_date && form.check_out_date <= form.check_in_date) {
      errs.check_out_date = "Must be after check-in date";
    }
    if (!form.num_guests || Number(form.num_guests) < 1) errs.num_guests = "Minimum 1 guest";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setCreating(true);
    try {
      const b = await checkinApi.createBooking({
        guest_name:        form.guest_name,
        guest_email:       form.guest_email,
        guest_phone:       form.guest_phone,
        check_in_date:     form.check_in_date,
        check_out_date:    form.check_out_date,
        num_guests:        Number(form.num_guests),
        booking_reference: form.booking_reference,
        notes:             form.notes,
      });
      setBooking(b);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create booking";
      setErrors({ guest_name: msg });
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!booking?.checkin_link) return;
    await navigator.clipboard.writeText(booking.checkin_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function sendEmail() {
    if (!booking) return;
    setSendingEmail(true); setEmailStatus("");
    try {
      await checkinApi.sendLink(booking.id);
      setEmailStatus("sent");
    } catch {
      setEmailStatus("failed");
    } finally {
      setSendingEmail(false);
    }
  }

  const inp = (hasErr?: boolean) =>
    `w-full bg-slate-50 border ${hasErr ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-cyan-500 focus:ring-cyan-100"} rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`;

  // ── Success state ────────────────────────────────────────────────────────────
  if (booking) {
    return (
      <div className="min-h-screen" style={{ background: "#F0F2F7" }}>
        {/* Header */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)", boxShadow: "0 4px 24px rgba(2,11,18,0.35)" }}>
          <div className="px-5 pt-10 pb-6 max-w-2xl mx-auto">
            {/* Success icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">Booking Created</p>
            <h1 className="text-2xl font-black text-white">{c.created}</h1>
            <p className="text-cyan-200/70 text-sm mt-1">{booking.guest_name} · Check-in {booking.check_in_date}</p>
          </div>
        </div>

        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
          {/* Check-in link */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{c.linkLabel}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-sm text-cyan-700 font-mono break-all leading-relaxed">{booking.checkin_link}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 font-black text-sm py-3 rounded-2xl transition-all active:scale-95"
                style={{ border: "2px solid #0E7490", color: "#0E7490", background: copied ? "#ECFEFF" : "white" }}>
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {c.copied}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {c.copyLink}
                  </>
                )}
              </button>
              {booking.guest_email && (
                <button onClick={sendEmail} disabled={sendingEmail || emailStatus === "sent"}
                  className="flex-1 flex items-center justify-center gap-2 font-black text-sm py-3 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 4px 14px rgba(14,116,144,0.35)" }}>
                  {sendingEmail ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{c.sending}</>
                  ) : emailStatus === "sent" ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{c.emailSent}</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{c.sendEmail}</>
                  )}
                </button>
              )}
            </div>

            {emailStatus === "failed" && (
              <p className="text-xs text-red-600 font-semibold">{c.emailFailed}</p>
            )}
            {emailStatus === "sent" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <p className="text-xs text-emerald-700 font-semibold">Email sent to {booking.guest_email}</p>
              </div>
            )}
          </div>

          {/* Booking summary */}
          <div className="bg-white rounded-2xl p-5 space-y-2.5" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Booking Details</p>
            {[
              { label: "Guest Name",   value: booking.guest_name },
              { label: "Check-in",     value: booking.check_in_date },
              { label: "Check-out",    value: booking.check_out_date },
              { label: "Guests",       value: String(booking.num_guests) },
              booking.guest_email ? { label: "Email",  value: booking.guest_email } : null,
              booking.guest_phone ? { label: "Phone",  value: booking.guest_phone } : null,
              booking.booking_reference ? { label: "Reference", value: booking.booking_reference } : null,
            ].filter(Boolean).map(row => (
              <div key={row!.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400 font-semibold">{row!.label}</span>
                <span className="text-sm text-slate-800 font-bold">{row!.value}</span>
              </div>
            ))}
          </div>

          <button onClick={() => router.push("/dashboard/checkin")}
            className="w-full font-black text-sm py-3.5 rounded-2xl bg-white text-slate-600 transition-all active:scale-[0.98]"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1.5px solid #E2E8F0" }}>
            {c.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F0F2F7" }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)", boxShadow: "0 4px 24px rgba(2,11,18,0.35)" }}>
        <div className="px-5 pt-10 pb-5 max-w-2xl mx-auto">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-cyan-300/80 text-sm font-semibold mb-4 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.checkin.dashboard.title}
          </button>
          <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-widest mb-1">New Booking</p>
          <h1 className="text-2xl font-black text-white">{c.title}</h1>
          <p className="text-cyan-200/70 text-sm mt-1">Fill in guest details to create a check-in booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        {/* Guest info */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#ECFEFF" }}>
              <svg className="w-4 h-4" fill="none" stroke="#0E7490" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-800">Guest Information</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.guestName} <span className="text-red-400">*</span></label>
            <input className={inp(!!errors.guest_name)} value={form.guest_name}
              onChange={e => setField("guest_name", e.target.value)} placeholder="e.g. John Smith" />
            {errors.guest_name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.guest_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.guestEmail}</label>
              <input type="email" className={inp()} value={form.guest_email}
                onChange={e => setField("guest_email", e.target.value)} placeholder="guest@email.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.guestPhone}</label>
              <input type="tel" className={inp()} value={form.guest_phone}
                onChange={e => setField("guest_phone", e.target.value)} placeholder="+44 7700 000000" />
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
              <svg className="w-4 h-4" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-800">Stay Details</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.checkIn} <span className="text-red-400">*</span></label>
              <input type="date" className={inp(!!errors.check_in_date)} value={form.check_in_date}
                onChange={e => setField("check_in_date", e.target.value)} />
              {errors.check_in_date && <p className="text-xs text-red-500 mt-1 font-medium">{errors.check_in_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.checkOut} <span className="text-red-400">*</span></label>
              <input type="date" className={inp(!!errors.check_out_date)} value={form.check_out_date}
                onChange={e => setField("check_out_date", e.target.value)} />
              {errors.check_out_date && <p className="text-xs text-red-500 mt-1 font-medium">{errors.check_out_date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.numGuests} <span className="text-red-400">*</span></label>
            <input type="number" min="1" max="50" className={inp(!!errors.num_guests)} value={form.num_guests}
              onChange={e => setField("num_guests", e.target.value)} />
            {errors.num_guests && <p className="text-xs text-red-500 mt-1 font-medium">{errors.num_guests}</p>}
          </div>
        </div>

        {/* Optional fields */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F0FDF4" }}>
              <svg className="w-4 h-4" fill="none" stroke="#059669" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-800">Optional Details</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.reference} <span className="text-slate-300 font-normal">(optional)</span></label>
            <input className={inp()} value={form.booking_reference}
              onChange={e => setField("booking_reference", e.target.value)} placeholder="e.g. BK-2026-0123" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{c.notes} <span className="text-slate-300 font-normal">(optional)</span></label>
            <textarea rows={3} className={inp() + " resize-none"} value={form.notes}
              onChange={e => setField("notes", e.target.value)}
              placeholder="Special requests, allergies, room preferences…" />
          </div>
        </div>

        <button type="submit" disabled={creating}
          className="w-full flex items-center justify-center gap-2 font-black text-sm py-4 rounded-2xl text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #083344, #0E7490)", boxShadow: "0 6px 20px rgba(14,116,144,0.35)", touchAction: "manipulation" }}>
          {creating ? (
            <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating…</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>{c.submit}</>
          )}
        </button>
      </form>
    </div>
  );
}
