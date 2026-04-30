"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    nationality: "",
    service: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-5 shadow-inner">
          ✅
        </div>
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Grazie! Thank You!
        </h3>
        <p className="text-slate-500 leading-relaxed max-w-xs">
          Your message has been received. Our concierge team will be in touch
          within a few hours.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-slate-50 focus:bg-white";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 space-y-5"
    >
      <div>
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">
          Send Us an Enquiry
        </h3>
        <p className="text-slate-400 text-sm">We reply within a few hours.</p>
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide" htmlFor="name">
            Full Name *
          </label>
          <input
            id="name" name="name" type="text" required
            value={form.name} onChange={handleChange}
            placeholder="e.g. Marco Rossi"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide" htmlFor="email">
            Email Address *
          </label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide" htmlFor="nationality">
            Your Country
          </label>
          <input
            id="nationality" name="nationality" type="text"
            value={form.nationality} onChange={handleChange}
            placeholder="e.g. Italy, Japan, USA…"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide" htmlFor="service">
            Service of Interest
          </label>
          <select
            id="service" name="service"
            value={form.service} onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select a service…</option>
            <option value="hotel">Hotel Reservation</option>
            <option value="transfer">Airport Transfer</option>
            <option value="dining">Fine Dining Reservation</option>
            <option value="tour">Guided Tour</option>
            <option value="concierge">Personal Concierge</option>
            <option value="other">Other / General Enquiry</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide" htmlFor="message">
          Your Message *
        </label>
        <textarea
          id="message" name="message" required rows={5}
          value={form.message} onChange={handleChange}
          placeholder="Tell us about your travel plans, dates, group size, or any special requests…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full text-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Sending…
          </span>
        ) : (
          "Send Enquiry"
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        🔒 Your details are kept private and secure
      </p>
    </form>
  );
}
