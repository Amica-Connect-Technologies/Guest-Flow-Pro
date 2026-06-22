"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkinApi, CheckinBooking } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type StatusFilter = "all" | "pending" | "completed" | "missing_info";

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  completed:    "bg-emerald-100 text-emerald-700",
  missing_info: "bg-red-100 text-red-700",
  expired:      "bg-slate-100 text-slate-500",
};

export default function AllBookingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const c = t.checkin;

  const [bookings, setBookings] = useState<CheckinBooking[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!token) router.replace("/login");
  }, [router]);

  function load(status?: string) {
    setLoading(true);
    setError("");
    checkinApi
      .listBookings(status && status !== "all" ? { status } : undefined)
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(filter); }, [filter]);

  async function handleSendLink(booking: CheckinBooking) {
    if (!booking.guest_email) return;
    setSendingId(booking.id);
    try {
      await checkinApi.sendLink(booking.id);
      setSentIds(prev => new Set(prev).add(booking.id));
    } catch {
      // silently fail — user will see button stays in "send" state
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(booking: CheckinBooking) {
    const msg = c.bookings.deleteConfirm.replace("{name}", booking.guest_name);
    if (!window.confirm(msg)) return;
    await checkinApi.deleteBooking(booking.id);
    setBookings(prev => prev.filter(b => b.id !== booking.id));
  }

  async function handleCopy(booking: CheckinBooking) {
    await navigator.clipboard.writeText(booking.checkin_link);
    setCopiedId(booking.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function exportCSV() {
    const res = await checkinApi.exportCSV();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guest-registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const statusLabel = (s: string) =>
    (c.status as Record<string, string>)[s] ?? s;

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all",          label: c.bookings.filterAll },
    { key: "pending",      label: c.bookings.filterPending },
    { key: "completed",    label: c.bookings.filterCompleted },
    { key: "missing_info", label: c.bookings.filterMissing },
  ];

  return (
    <div className="min-h-screen bg-[#ECEEF3]">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-slate-100">
        <button onClick={() => router.back()} className="text-cyan-700 text-sm font-semibold mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {c.dashboard.title}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{c.bookings.title}</h1>
          <button
            onClick={exportCSV}
            className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full"
          >
            {c.dashboard.exportCSV}
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-cyan-700 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">{c.bookings.noResults}</p>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{b.guest_name}</p>
                  {b.booking_reference && (
                    <p className="text-[11px] text-slate-400">Ref: {b.booking_reference}</p>
                  )}
                </div>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                  {statusLabel(b.status)}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-slate-500 mb-3">
                <span>📅 {b.check_in_date} → {b.check_out_date}</span>
                <span>👤 {b.num_guests}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCopy(b)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {copiedId === b.id ? c.bookings.copied : c.bookings.copyLink}
                </button>

                {b.guest_email && b.status !== "completed" && (
                  <button
                    onClick={() => handleSendLink(b)}
                    disabled={sendingId === b.id}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      sentIds.has(b.id)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-cyan-700 text-white"
                    } disabled:opacity-60`}
                  >
                    {sendingId === b.id
                      ? c.bookings.sending
                      : sentIds.has(b.id) || b.link_sent_at
                        ? c.bookings.sent
                        : c.bookings.sendLink}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(b)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 ml-auto"
                >
                  {c.bookings.delete}
                </button>
              </div>

              {/* Registration summary if completed */}
              {b.registration && (
                <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {b.registration.first_name} {b.registration.last_name}
                  </span>
                  {" · "}
                  {b.registration.nationality}
                  {" · "}
                  {b.registration.document_type.replace("_", " ")}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
