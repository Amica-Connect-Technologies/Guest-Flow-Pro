"use client";

import { useCallback, useEffect, useState } from "react";
import { bookingRequestsApi, type BookingRequest } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const T = {
  en: {
    title: "Direct Booking Enquiries", subtitle: "Direct room enquiries from guests",
    statTotal: "Total", statPending: "Pending", statConfirmed: "Confirmed", statDeclined: "Declined",
    filterAll: "All",
    statusPending: "Pending", statusConfirmed: "Confirmed", statusDeclined: "Declined",
    checkIn: "Check-in", checkOut: "Check-out", guestsNights: "Guests / Nights",
    roomType: "Room Type", guestMessage: "Guest Message", internalNotes: "Internal Notes",
    notesPlaceholder: "Add internal notes (not visible to guest)...",
    saveNotes: "Save Notes", saving: "Saving…",
    confirm: "✓ Mark Confirmed", decline: "✕ Mark Declined", deleteBtn: "Delete",
    received: "Received",
    noRequests: "No booking requests", noRequestsSub: "Guest requests will appear here",
    noFiltered: (f: string) => `No ${f} requests`,
  },
  it: {
    title: "Richieste di Prenotazione", subtitle: "Richieste dirette dagli ospiti",
    statTotal: "Totale", statPending: "In Attesa", statConfirmed: "Confermate", statDeclined: "Rifiutate",
    filterAll: "Tutte",
    statusPending: "In Attesa", statusConfirmed: "Confermata", statusDeclined: "Rifiutata",
    checkIn: "Check-in", checkOut: "Check-out", guestsNights: "Ospiti / Notti",
    roomType: "Tipo Camera", guestMessage: "Messaggio Ospite", internalNotes: "Note Interne",
    notesPlaceholder: "Aggiungi note interne (non visibili all'ospite)...",
    saveNotes: "Salva Note", saving: "Salvataggio…",
    confirm: "✓ Conferma", decline: "✕ Rifiuta", deleteBtn: "Elimina",
    received: "Ricevuta",
    noRequests: "Nessuna richiesta di prenotazione", noRequestsSub: "Le richieste degli ospiti appariranno qui",
    noFiltered: (f: string) => `Nessuna richiesta ${f}`,
  },
  es: {
    title: "Solicitudes de Reserva", subtitle: "Consultas directas de los huéspedes",
    statTotal: "Total", statPending: "Pendiente", statConfirmed: "Confirmadas", statDeclined: "Rechazadas",
    filterAll: "Todas",
    statusPending: "Pendiente", statusConfirmed: "Confirmada", statusDeclined: "Rechazada",
    checkIn: "Check-in", checkOut: "Check-out", guestsNights: "Huéspedes / Noches",
    roomType: "Tipo de Habitación", guestMessage: "Mensaje del Huésped", internalNotes: "Notas Internas",
    notesPlaceholder: "Agrega notas internas (no visibles para el huésped)...",
    saveNotes: "Guardar Notas", saving: "Guardando…",
    confirm: "✓ Confirmar", decline: "✕ Rechazar", deleteBtn: "Eliminar",
    received: "Recibida",
    noRequests: "Sin solicitudes de reserva", noRequestsSub: "Las solicitudes de huéspedes aparecerán aquí",
    noFiltered: (f: string) => `Sin solicitudes ${f}`,
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function nights(cin: string, cout: string) {
  const diff = (new Date(cout).getTime() - new Date(cin).getTime()) / 86400000;
  return isNaN(diff) ? "—" : `${diff}n`;
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({
  req,
  onUpdate,
  onDelete,
  t,
}: {
  req: BookingRequest;
  onUpdate: (id: string, data: { status?: string; hotel_notes?: string }) => Promise<void>;
  onDelete: (id: string) => void;
  t: (typeof T)[keyof typeof T];
}) {
  const STATUS_CFG = {
    pending:   { label: t.statusPending,   cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"   },
    confirmed: { label: t.statusConfirmed, cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    declined:  { label: t.statusDeclined,  cls: "bg-red-100 text-red-600",       dot: "bg-red-500"     },
  } as const;
  const cfg = STATUS_CFG[req.status];
  const [notes, setNotes] = useState(req.hotel_notes);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function changeStatus(s: "confirmed" | "declined") {
    setSaving(true);
    await onUpdate(req.id, { status: s });
    setSaving(false);
  }

  async function saveNotes() {
    setSaving(true);
    await onUpdate(req.id, { hotel_notes: notes });
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      {/* Header row */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0E7490,#083344)" }}>
          {req.guest_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-slate-900 text-sm">{req.guest_name}</p>
            <span className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
            {req.guest_email && <span>{req.guest_email}</span>}
            {req.guest_phone && <span>{req.guest_phone}</span>}
          </div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Date strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        {[
          [t.checkIn, fmt(req.check_in_date)],
          [t.checkOut, fmt(req.check_out_date)],
          [t.guestsNights, `${req.num_guests} · ${nights(req.check_in_date, req.check_out_date)}`],
        ].map(([l, v]) => (
          <div key={l} className="px-4 py-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">{l}</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {req.room_type && (
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">{t.roomType}</p>
              <p className="text-sm text-slate-600">{req.room_type}</p>
            </div>
          )}
          {req.message && (
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">{t.guestMessage}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{req.message}</p>
            </div>
          )}

          {/* Hotel notes */}
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">{t.internalNotes}</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 resize-none"
            />
            {notes !== req.hotel_notes && (
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                style={{ background: "linear-gradient(135deg, #083344, #0E7490)" }}>
                {saving ? t.saving : t.saveNotes}
              </button>
            )}
          </div>

          {/* Invitation status — shown once the enquiry has been confirmed */}
          {req.status === "confirmed" && (
            <div className="rounded-xl px-3.5 py-2.5" style={{ background: req.invitation_sent_at ? "#ECFDF5" : "#FFFBEB" }}>
              {req.invitation_sent_at ? (
                <p className="text-xs font-bold text-emerald-700">
                  ✓ Check-in invitation emailed {fmt(req.invitation_sent_at)}
                </p>
              ) : (
                <>
                  <p className="text-xs font-bold text-amber-700">No email on file — share this check-in link manually</p>
                  {req.checkin_link && (
                    <p className="text-[11px] text-amber-600 mt-1 break-all font-mono">{req.checkin_link}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {req.status !== "confirmed" && (
              <button
                onClick={() => changeStatus("confirmed")}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                {t.confirm}
              </button>
            )}
            {req.status !== "declined" && (
              <button
                onClick={() => changeStatus("declined")}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors">
                {t.decline}
              </button>
            )}
            <button
              onClick={() => onDelete(req.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
              {t.deleteBtn}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-right">{t.received} {fmt(req.created_at)}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingRequestsPage() {
  const { lang } = useLanguage();
  const t = T[lang as keyof typeof T] ?? T.en;

  const FILTERS = [
    { key: undefined,    label: t.filterAll      },
    { key: "pending",    label: t.statPending    },
    { key: "confirmed",  label: t.statConfirmed  },
    { key: "declined",   label: t.statDeclined   },
  ] as const;

  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await bookingRequestsApi.list(filter));
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(id: string, data: { status?: string; hotel_notes?: string }) {
    try {
      const updated = await bookingRequestsApi.update(id, data);
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast(data.status ? `Request ${data.status}` : "Notes saved");
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this booking request?")) return;
    try {
      await bookingRequestsApi.delete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      showToast("Request deleted");
    } catch {}
  }

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    confirmed: requests.filter(r => r.status === "confirmed").length,
    declined: requests.filter(r => r.status === "declined").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#F0F2F7" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Desktop page header bar */}
      <div className="hidden md:flex items-center gap-2.5 px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8m-8 3.75h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-base font-bold text-slate-800">{t.title}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Mobile header */}
        <div className="mb-6 md:mb-8 md:hidden">
          <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>
        <p className="hidden md:block text-slate-400 text-sm -mt-2 mb-6">{t.subtitle}</p>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t.statTotal,     value: counts.all,       color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC" },
            { label: t.statPending,   value: counts.pending,   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
            { label: t.statConfirmed, value: counts.confirmed, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
            { label: t.statDeclined,  value: counts.declined,  color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs font-bold mt-0.5 text-slate-500">{label}</p>
              <div className="w-8 h-1 rounded-full mx-auto mt-2" style={{ background: bg }} />
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button key={String(f.key ?? "all")}
              onClick={() => setFilter(f.key)}
              className="relative px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={filter === f.key
                ? { background: "linear-gradient(135deg, #083344, #0E7490)", color: "white", boxShadow: "0 4px 14px rgba(14,116,144,0.35)" }
                : { background: "white", color: "#64748B", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {f.label}
              {f.key === "pending" && counts.pending > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-10 flex items-center justify-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "#0E7490", borderTopColor: "transparent" }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#ECFEFF" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0E7490" strokeWidth={1.75} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8m-8 3.75h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-black text-slate-800 text-base">{t.noRequests}</p>
            <p className="text-slate-400 text-sm mt-1.5">
              {filter ? t.noFiltered(filter) : t.noRequestsSub}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <RequestCard key={r.id} req={r} onUpdate={handleUpdate} onDelete={handleDelete} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
