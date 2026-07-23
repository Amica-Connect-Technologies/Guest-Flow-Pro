"use client";

import { useCallback, useEffect, useState } from "react";
import { reviewsApi, type ReviewRequest } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const T = {
  en: {
    title: "Guest Reviews", subtitle: "Collect and manage post-stay feedback",
    statTotal: "Total", statSubmitted: "Submitted", statAvg: "Avg Rating", statAwaiting: "Awaiting",
    ratingDist: "Rating Distribution",
    statusReviewed: "Reviewed", statusLinkSent: "Link Sent", statusNotSent: "Not Sent",
    submitted: "Submitted",
    reviewLink: "Review Link", copy: "Copy",
    platformLinks: "Platform Links (shown to guest after review)",
    googlePlaceholder: "Google Review URL...", taPlaceholder: "TripAdvisor URL...",
    saveLinks: "Save Links", saving: "Saving…",
    sendLink: "Send Review Link", resendLink: "Resend Link", sending: "Sending…",
    deleteBtn: "Delete",
    noReviews: "No reviews yet",
    noReviewsSub: "Send review links from the Bookings page after guests check out",
    notRated: "Not rated",
    created: "Created",
  },
  it: {
    title: "Recensioni Ospiti", subtitle: "Raccogli e gestisci i feedback post-soggiorno",
    statTotal: "Totale", statSubmitted: "Inviate", statAvg: "Voto Medio", statAwaiting: "In Attesa",
    ratingDist: "Distribuzione Valutazioni",
    statusReviewed: "Recensita", statusLinkSent: "Link Inviato", statusNotSent: "Non Inviato",
    submitted: "Inviata",
    reviewLink: "Link Recensione", copy: "Copia",
    platformLinks: "Link Piattaforme (mostrati all'ospite dopo la recensione)",
    googlePlaceholder: "URL Recensione Google...", taPlaceholder: "URL TripAdvisor...",
    saveLinks: "Salva Link", saving: "Salvataggio…",
    sendLink: "Invia Link Recensione", resendLink: "Reinvia Link", sending: "Invio…",
    deleteBtn: "Elimina",
    noReviews: "Nessuna recensione ancora",
    noReviewsSub: "Invia link di recensione dalla pagina Prenotazioni dopo il check-out",
    notRated: "Non valutato",
    created: "Creata",
  },
  es: {
    title: "Reseñas de Huéspedes", subtitle: "Recoge y gestiona el feedback post-estancia",
    statTotal: "Total", statSubmitted: "Enviadas", statAvg: "Valoración Media", statAwaiting: "Pendientes",
    ratingDist: "Distribución de Valoraciones",
    statusReviewed: "Reseñada", statusLinkSent: "Enlace Enviado", statusNotSent: "No Enviado",
    submitted: "Enviada",
    reviewLink: "Enlace de Reseña", copy: "Copiar",
    platformLinks: "Enlace a Plataformas (mostrado al huésped tras la reseña)",
    googlePlaceholder: "URL Reseña Google...", taPlaceholder: "URL TripAdvisor...",
    saveLinks: "Guardar Enlace", saving: "Guardando…",
    sendLink: "Enviar Enlace de Reseña", resendLink: "Reenviar Enlace", sending: "Enviando…",
    deleteBtn: "Eliminar",
    noReviews: "Sin reseñas aún",
    noReviewsSub: "Envía enlaces de reseña desde la página de Reservas tras el check-out",
    notRated: "Sin valorar",
    created: "Creada",
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function Stars({ n, notRated }: { n: number | null; notRated: string }) {
  if (!n) return <span className="text-slate-500 text-xs">{notRated}</span>;
  const colors = ["", "#EF4444", "#F97316", "#EAB308", "#10B981", "#06B6D4"];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4"
          fill={i <= n ? colors[n] : "none"}
          stroke={i <= n ? colors[n] : "#334155"}
          strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({
  review,
  onSendLink,
  onDelete,
  onSaveLinks,
  t,
}: {
  review: ReviewRequest;
  onSendLink: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onSaveLinks: (id: string, google: string, ta: string) => Promise<void>;
  t: (typeof T)[keyof typeof T];
}) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [google, setGoogle] = useState(review.google_review_url);
  const [ta, setTa] = useState(review.tripadvisor_url);
  const [saving, setSaving] = useState(false);

  async function send() {
    setSending(true);
    await onSendLink(review.id);
    setSending(false);
  }

  async function saveLinks() {
    setSaving(true);
    await onSaveLinks(review.id, google, ta);
    setSaving(false);
  }

  const linksChanged = google !== review.google_review_url || ta !== review.tripadvisor_url;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Main row */}
      <div className="flex items-start gap-4 p-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0E7490,#083344)" }}>
          {review.guest_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-white text-sm">{review.guest_name}</p>
            {review.is_submitted ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{t.statusReviewed}</span>
            ) : review.sent_at ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{t.statusLinkSent}</span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{t.statusNotSent}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ref: {review.booking_reference || "—"} · {fmt(review.check_in_date)} → {fmt(review.check_out_date)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Stars n={review.rating} notRated={t.notRated} />
          <button onClick={() => setExpanded(v => !v)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rating bar */}
      {review.is_submitted && review.rating && (
        <div className="px-5 pb-4">
          {review.comment && (
            <p className="text-sm text-slate-300 italic leading-relaxed mb-3">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}
          <p className="text-[10px] text-slate-500">{t.submitted} {fmt(review.submitted_at)}</p>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-4">
          {/* Review link */}
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-2">{t.reviewLink}</p>
            <div className="flex items-center gap-2">
              <input readOnly value={review.review_link}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate focus:outline-none" />
              <button onClick={() => navigator.clipboard.writeText(review.review_link)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex-shrink-0">
                {t.copy}
              </button>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-2">{t.platformLinks}</p>
            <div className="space-y-2">
              <input value={google} onChange={e => setGoogle(e.target.value)}
                placeholder={t.googlePlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              <input value={ta} onChange={e => setTa(e.target.value)}
                placeholder={t.taPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              {linksChanged && (
                <button onClick={saveLinks} disabled={saving}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors">
                  {saving ? t.saving : t.saveLinks}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!review.is_submitted && (
              <button onClick={send} disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors">
                {sending ? t.sending : review.sent_at ? t.resendLink : t.sendLink}
              </button>
            )}
            <button onClick={() => onDelete(review.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors">
              {t.deleteBtn}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-right">{t.created} {fmt(review.created_at)}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const { lang } = useLanguage();
  const t = T[lang as keyof typeof T] ?? T.en;

  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", ok: true });

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try { setReviews(await reviewsApi.list()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSendLink(id: string) {
    try {
      await reviewsApi.sendLink(id);
      showToast("Review link sent to guest");
      await load();
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "Failed to send", false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review record?")) return;
    try {
      await reviewsApi.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      showToast("Deleted");
    } catch {}
  }

  async function handleSaveLinks(id: string, google: string, ta: string) {
    try {
      const updated = await reviewsApi.updateLinks(id, { google_review_url: google, tripadvisor_url: ta });
      setReviews(prev => prev.map(r => r.id === id ? updated : r));
      showToast("Links saved");
    } catch {
      showToast("Failed to save", false);
    }
  }

  const submitted = reviews.filter(r => r.is_submitted);
  const avg = submitted.length > 0
    ? (submitted.reduce((s, r) => s + (r.rating ?? 0), 0) / submitted.length).toFixed(1)
    : "—";
  const sent = reviews.filter(r => r.sent_at && !r.is_submitted).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      {toast.msg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 whitespace-nowrap ${toast.ok ? "bg-slate-800" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: t.statTotal,     value: reviews.length,   icon: "📋", color: "#0E7490" },
            { label: t.statSubmitted, value: submitted.length, icon: "⭐", color: "#F59E0B" },
            { label: t.statAvg,       value: avg,              icon: "📊", color: "#10B981" },
            { label: t.statAwaiting,  value: sent,             icon: "📨", color: "#8B5CF6" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <p className="text-xl font-black text-white">{value}</p>
              </div>
              <p className="text-xs font-bold" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        {submitted.length > 0 && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.ratingDist}</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(n => {
                const count = submitted.filter(r => r.rating === n).length;
                const pct = submitted.length > 0 ? (count / submitted.length) * 100 : 0;
                const colors = ["", "#EF4444", "#F97316", "#EAB308", "#10B981", "#06B6D4"];
                return (
                  <div key={n} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-bold w-4 text-right">{n}</span>
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill={colors[n]}>
                      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                    </svg>
                    <div className="flex-1 h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: colors[n] }} />
                    </div>
                    <span className="text-xs text-slate-400 font-bold w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">⭐</p>
            <p className="text-white font-bold text-lg">{t.noReviews}</p>
            <p className="text-slate-400 text-sm mt-1">{t.noReviewsSub}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <ReviewCard key={r.id} review={r}
                onSendLink={handleSendLink}
                onDelete={handleDelete}
                onSaveLinks={handleSaveLinks}
                t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
