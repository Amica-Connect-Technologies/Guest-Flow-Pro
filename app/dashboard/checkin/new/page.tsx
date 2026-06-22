"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkinApi, CheckinBooking } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type FormState = {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: string;
  booking_reference: string;
  notes: string;
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

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [creating, setCreating] = useState(false);
  const [booking, setBooking] = useState<CheckinBooking | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"" | "sent" | "failed">("");

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
      errs.check_out_date = "Must be after check-in";
    }
    if (!form.num_guests || Number(form.num_guests) < 1) errs.num_guests = "Min 1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setCreating(true);
    try {
      const b = await checkinApi.createBooking({
        guest_name: form.guest_name,
        guest_email: form.guest_email,
        guest_phone: form.guest_phone,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        num_guests: Number(form.num_guests),
        booking_reference: form.booking_reference,
        notes: form.notes,
      });
      setBooking(b);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setErrors({ guest_name: msg });
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!booking?.checkin_link) return;
    await navigator.clipboard.writeText(booking.checkin_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    if (!booking) return;
    setSendingEmail(true);
    setEmailStatus("");
    try {
      await checkinApi.sendLink(booking.id);
      setEmailStatus("sent");
    } catch {
      setEmailStatus("failed");
    } finally {
      setSendingEmail(false);
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white";
  const errCls = "text-xs text-red-500 mt-1";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";

  // ── Success state — booking created ──────────────────────────────────────
  if (booking) {
    return (
      <div className="min-h-screen bg-[#ECEEF3]">
        <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900">{c.created}</h1>
          <p className="text-sm text-slate-500">{booking.guest_name} · {booking.check_in_date}</p>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{c.linkLabel}</p>
            <p className="text-sm text-cyan-700 font-mono break-all bg-cyan-50 rounded-xl px-3 py-2">
              {booking.checkin_link}
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyLink}
                className="flex-1 border-2 border-cyan-700 text-cyan-700 font-bold text-sm py-2.5 rounded-xl"
              >
                {copied ? c.copied : c.copyLink}
              </button>
              {booking.guest_email && (
                <button
                  onClick={sendEmail}
                  disabled={sendingEmail || emailStatus === "sent"}
                  className="flex-1 bg-cyan-700 text-white font-bold text-sm py-2.5 rounded-xl disabled:opacity-60"
                >
                  {sendingEmail ? c.sending : emailStatus === "sent" ? c.emailSent : c.sendEmail}
                </button>
              )}
            </div>
            {emailStatus === "failed" && (
              <p className="text-xs text-red-600">{c.emailFailed}</p>
            )}
          </div>

          <button
            onClick={() => router.push("/dashboard/checkin")}
            className="w-full text-cyan-700 font-bold text-sm py-3 rounded-2xl border-2 border-cyan-100 bg-white"
          >
            {c.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#ECEEF3]">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
        <button onClick={() => router.back()} className="text-cyan-700 text-sm font-semibold mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.checkin.dashboard.title}
        </button>
        <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <label className={labelCls}>{c.guestName} *</label>
            <input className={inputCls} value={form.guest_name} onChange={e => setField("guest_name", e.target.value)} placeholder="e.g. Mario Rossi" />
            {errors.guest_name && <p className={errCls}>{errors.guest_name}</p>}
          </div>
          <div>
            <label className={labelCls}>{c.guestEmail}</label>
            <input type="email" className={inputCls} value={form.guest_email} onChange={e => setField("guest_email", e.target.value)} placeholder="guest@example.com" />
          </div>
          <div>
            <label className={labelCls}>{c.guestPhone}</label>
            <input type="tel" className={inputCls} value={form.guest_phone} onChange={e => setField("guest_phone", e.target.value)} placeholder="+39 333 000 0000" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{c.checkIn} *</label>
              <input type="date" className={inputCls} value={form.check_in_date} onChange={e => setField("check_in_date", e.target.value)} />
              {errors.check_in_date && <p className={errCls}>{errors.check_in_date}</p>}
            </div>
            <div>
              <label className={labelCls}>{c.checkOut} *</label>
              <input type="date" className={inputCls} value={form.check_out_date} onChange={e => setField("check_out_date", e.target.value)} />
              {errors.check_out_date && <p className={errCls}>{errors.check_out_date}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>{c.numGuests} *</label>
            <input type="number" min="1" max="50" className={inputCls} value={form.num_guests} onChange={e => setField("num_guests", e.target.value)} />
            {errors.num_guests && <p className={errCls}>{errors.num_guests}</p>}
          </div>
          <div>
            <label className={labelCls}>{c.reference}</label>
            <input className={inputCls} value={form.booking_reference} onChange={e => setField("booking_reference", e.target.value)} placeholder="e.g. BK-2026-0123" />
          </div>
          <div>
            <label className={labelCls}>{c.notes}</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={e => setField("notes", e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white font-bold py-4 rounded-2xl text-sm shadow-md disabled:opacity-60"
        >
          {creating ? c.creating : c.submit}
        </button>
      </form>
    </div>
  );
}
