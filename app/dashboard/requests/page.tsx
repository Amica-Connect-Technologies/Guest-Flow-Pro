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
    pending:   { label: t.statusPending,   cls: "bg-amber-500/15 text-amber-400",  dot: "bg-amber-400" },
    confirmed: { label: t.statusConfirmed, cls: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
    declined:  { label: t.statusDeclined,  cls: "bg-red-500/15 text-red-400",      dot: "bg-red-400"  },
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
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header row */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0E7490,#083344)" }}>
          {req.guest_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-white text-sm">{req.guest_name}</p>
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
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Date strip */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5">
        {[
          [t.checkIn, fmt(req.check_in_date)],
          [t.checkOut, fmt(req.check_out_date)],
          [t.guestsNights, `${req.num_guests} · ${nights(req.check_in_date, req.check_out_date)}`],
        ].map(([l, v]) => (
          <div key={l} className="px-4 py-3">
            <p className="text-[10px] text-slate-500 font-semibold uppercase">{l}</p>
            <p className="text-sm font-bold text-white mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-4">
          {req.room_type && (
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">{t.roomType}</p>
              <p className="text-sm text-slate-300">{req.room_type}</p>
            </div>
          )}
          {req.message && (
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">{t.guestMessage}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{req.message}</p>
            </div>
          )}

          {/* Hotel notes */}
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">{t.internalNotes}</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
            />
            {notes !== req.hotel_notes && (
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors">
                {saving ? t.saving : t.saveNotes}
              </button>
            )}
          </div>

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
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {t.decline}
              </button>
            )}
            <button
              onClick={() => onDelete(req.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors">
              {t.deleteBtn}
            </button>
          </div>

          <p className="text-[10px] text-slate-600 text-right">{t.received} {fmt(req.created_at)}</p>
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
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t.statTotal,     value: counts.all,       color: "#0E7490" },
            { label: t.statPending,   value: counts.pending,   color: "#F59E0B" },
            { label: t.statConfirmed, value: counts.confirmed, color: "#10B981" },
            { label: t.statDeclined,  value: counts.declined,  color: "#EF4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button key={String(f.key ?? "all")}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f.key
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}>
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
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">📬</p>
            <p className="text-white font-bold text-lg">{t.noRequests}</p>
            <p className="text-slate-400 text-sm mt-1">
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
