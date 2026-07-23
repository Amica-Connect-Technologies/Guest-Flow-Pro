"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { hotelsApi, bookingRequestsApi, type Hotel } from "@/lib/api";

const ROOM_TYPES = [
  "Standard Room", "Superior Room", "Deluxe Room",
  "Junior Suite", "Suite", "Family Room", "Twin Room", "Double Room",
];

type Form = {
  guest_name: string; guest_email: string; guest_phone: string;
  check_in_date: string; check_out_date: string;
  num_guests: string; room_type: string; message: string;
};
const blank = (): Form => ({
  guest_name: "", guest_email: "", guest_phone: "",
  check_in_date: "", check_out_date: "",
  num_guests: "1", room_type: "", message: "",
});

export default function PublicBookingRequestPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(blank());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    hotelsApi.get(hotelId).then(setHotel).catch(() => {}).finally(() => setLoading(false));
  }, [hotelId]);

  function set(key: keyof Form, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guest_name.trim()) { setError("Please enter your name."); return; }
    if (!form.check_in_date)    { setError("Please select a check-in date."); return; }
    if (!form.check_out_date)   { setError("Please select a check-out date."); return; }
    if (form.check_out_date <= form.check_in_date) { setError("Check-out must be after check-in."); return; }

    setSubmitting(true);
    setError("");
    try {
      await bookingRequestsApi.submitPublic(hotelId, {
        guest_name:     form.guest_name.trim(),
        guest_email:    form.guest_email.trim() || undefined,
        guest_phone:    form.guest_phone.trim() || undefined,
        check_in_date:  form.check_in_date,
        check_out_date: form.check_out_date,
        num_guests:     parseInt(form.num_guests) || 1,
        room_type:      form.room_type || undefined,
        message:        form.message.trim() || undefined,
      });
      setDone(true);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-cyan-400 animate-spin" />
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 100%)" }}>
      <p className="text-4xl mb-4">🏨</p>
      <p className="text-white font-black text-2xl">Hotel not found</p>
      <p className="text-slate-400 text-sm mt-2">This booking link may be invalid or expired.</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.5} className="w-12 h-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-white font-black text-3xl mb-2">Request Sent!</h1>
      <p className="text-slate-300 text-base mb-2">
        Thank you, <strong className="text-white">{form.guest_name}</strong>.
      </p>
      <p className="text-slate-400 text-sm max-w-xs">
        The team at <span className="text-white font-semibold">{hotel.name}</span> will review your request and get back to you shortly.
      </p>
      <button
        onClick={() => router.push(`/h/${hotelId}`)}
        className="mt-8 px-6 py-3 rounded-2xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
        ← Back to {hotel.name}
      </button>
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen pb-16"
      style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8 flex items-center gap-4">
        <button onClick={() => router.push(`/h/${hotelId}`)}
          className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-white hover:bg-white/15 transition-colors flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        {hotel.logo_url ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={40} height={40} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="text-white font-black text-sm">{hotel.name.slice(0,2).toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-black text-base leading-tight truncate">{hotel.name}</p>
          <p className="text-cyan-400/70 text-xs">{hotel.city}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6">
        <h1 className="text-white font-black text-2xl mb-1">Book a Room</h1>
        <p className="text-slate-400 text-sm mb-6">Fill in your details and the hotel will confirm availability.</p>

        <form onSubmit={submit} className="space-y-4">

          {/* Guest name */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.guest_name}
              onChange={e => set("guest_name", e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={form.guest_email}
                onChange={e => set("guest_email", e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
              <input
                type="tel"
                value={form.guest_phone}
                onChange={e => set("guest_phone", e.target.value)}
                placeholder="+39 000 000 0000"
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Check-in <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={form.check_in_date}
                onChange={e => set("check_in_date", e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all [color-scheme:dark]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Check-out <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                min={form.check_in_date || today}
                value={form.check_out_date}
                onChange={e => set("check_out_date", e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all [color-scheme:dark]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
          </div>

          {/* Guests + Room type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Guests</label>
              <select
                value={form.num_guests}
                onChange={e => set("num_guests", e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n} style={{ background: "#083344" }}>{n} guest{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Room type</label>
              <select
                value={form.room_type}
                onChange={e => set("room_type", e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-slate-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                <option value="" style={{ background: "#083344" }}>Any / flexible</option>
                {ROOM_TYPES.map(r => (
                  <option key={r} value={r} style={{ background: "#083344" }}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Special requests</label>
            <textarea
              value={form.message}
              onChange={e => set("message", e.target.value)}
              rows={3}
              placeholder="Any special requests, preferences, or questions…"
              className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-none placeholder:text-slate-500"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{
              background: submitting ? "#64748B" : "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
              boxShadow: submitting ? "none" : "0 8px 28px rgba(8,145,178,0.35)",
            }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending request…
              </span>
            ) : "Send Booking Request →"}
          </button>

          <p className="text-center text-xs text-slate-600 pb-4">
            This is a booking request — not a confirmed reservation. {hotel.name} will contact you to confirm.
          </p>
        </form>
      </div>
    </div>
  );
}
