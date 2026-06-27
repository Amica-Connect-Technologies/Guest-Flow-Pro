"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, registrationsApi, type Registration } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending_payment: { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400"   },
  pending_review:  { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  approved:        { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected:        { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-400"     },
};

const FILTER_KEYS = ["all", "pending_review", "approved", "rejected", "pending_payment"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

export default function AdminRegistrations() {
  const router = useRouter();
  const { t } = useLanguage();

  const STATUS_LABELS: Record<string, string> = {
    pending_payment: t.adminRegistrations.statusAwaitingPayment,
    pending_review:  t.adminRegistrations.statusPendingReview,
    approved:        t.adminRegistrations.statusApproved,
    rejected:        t.adminRegistrations.statusRejected,
  };

  const PLAN_LABELS: Record<string, string> = {
    basic: t.adminRegistrations.planBasic,
    pro:   t.adminRegistrations.planPro,
  };

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState({ msg: "", error: false });
  const [rejectSheet, setRejectSheet] = useState<{ reg: Registration; reason: string } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);

  useEffect(() => {
    auth.me().catch(() => router.push("/login"));
    fetchRegistrations();
  }, [router]);

  async function fetchRegistrations() {
    try { setRegistrations(await registrationsApi.list()); } catch { /* stay */ }
    setLoading(false);
  }

  async function handleApprove(reg: Registration) {
    if (!confirm(t.adminRegistrations.approveConfirm.replace("{name}", reg.business_name))) return;
    setActioning(true);
    try {
      await registrationsApi.approve(reg.id);
      showToast(t.adminRegistrations.approveSuccess.replace("{name}", reg.business_name));
      fetchRegistrations();
    } catch (e) { showToast(e instanceof Error ? e.message : t.adminRegistrations.approveFailed, true); }
    setActioning(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.adminRegistrations.deleteConfirm)) return;
    setActioning(true);
    try {
      await registrationsApi.delete(id);
      showToast(t.adminRegistrations.deleted);
      fetchRegistrations();
    } catch (e) { showToast(e instanceof Error ? e.message : t.adminRegistrations.deleteFailed, true); }
    setActioning(false);
  }

  async function handleReject() {
    if (!rejectSheet) return;
    setActioning(true);
    try {
      await registrationsApi.reject(rejectSheet.reg.id, rejectSheet.reason);
      showToast(t.adminRegistrations.rejected);
      setRejectSheet(null);
      fetchRegistrations();
    } catch (e) { showToast(e instanceof Error ? e.message : t.adminRegistrations.rejectFailed, true); }
    setActioning(false);
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3500);
  }

  const countFor = (key: FilterKey) =>
    key === "all" ? registrations.length : registrations.filter((r) => r.status === key).length;

  const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);
  const pendingCount  = registrations.filter((r) => r.status === "pending_review").length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const rejectedCount = registrations.filter((r) => r.status === "rejected").length;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">{t.adminRegistrations.loadingRegistrations}</p>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending_review;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
        {STATUS_LABELS[status] ?? status}
      </span>
    );
  };

  const FILTER_LABELS: Record<FilterKey, string> = {
    all:             t.adminRegistrations.filterAll,
    pending_review:  t.adminRegistrations.filterPending,
    approved:        t.adminRegistrations.filterApproved,
    rejected:        t.adminRegistrations.filterRejected,
    pending_payment: t.adminRegistrations.filterUnpaid,
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[300] text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold ${toast.error ? "bg-red-500" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Payment proof lightbox ────────────────────────────────── */}
      {proofImage && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-10"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setProofImage(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setProofImage(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-xs font-semibold text-slate-300">Payment Proof</p>
                <a href={proofImage} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                  Open full size
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofImage} alt="Payment proof" className="w-full max-h-[75vh] object-contain bg-slate-50" />
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div className="px-4 md:px-8 max-w-screen-xl">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Admin</p>
              <h1 className="font-black text-slate-900 text-base md:text-xl leading-none">
                {t.adminRegistrations.pageTitle}
                {pendingCount > 0 && (
                  <span className="ml-2 text-xs font-black bg-red-500 text-white px-2 py-0.5 rounded-full align-middle">
                    {pendingCount} pending
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {FILTER_KEYS.map((key) => {
              const active = filter === key;
              const count = countFor(key);
              return (
                <button key={key} onClick={() => setFilter(key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl transition-colors ${
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}>
                  {FILTER_LABELS[key]}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-28 md:pb-10 max-w-screen-xl space-y-4">

        {/* ── Stats cards (desktop only) ────────────────────────────── */}
        {registrations.length > 0 && (
          <div className="hidden md:grid grid-cols-4 gap-4">
            {([
              {
                label: "Total", value: registrations.length, iconBg: "#DBEAFE", iconColor: "#2563EB",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
              },
              {
                label: "Pending", value: pendingCount, iconBg: "#FEF3C7", iconColor: "#D97706",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                label: "Approved", value: approvedCount, iconBg: "#D1FAE5", iconColor: "#059669",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                label: "Rejected", value: rejectedCount, iconBg: "#FFE4E6", iconColor: "#E11D48",
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
            ] as { label: string; value: number; iconBg: string; iconColor: string; icon: React.ReactNode }[]).map(({ label, value, iconBg, iconColor, icon }) => (
              <div key={label} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, color: iconColor }}>{icon}</div>
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-semibold">{t.adminRegistrations.noRegistrations}</p>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* ── DESKTOP TABLE ──────────────────────────────────────── */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_130px_140px_80px_200px] items-center gap-4 px-6 py-3 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Hotel / Owner</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">City</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contact</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</p>
              </div>

              {filtered.map((reg, i) => (
                <div key={reg.id}
                  className="grid grid-cols-[1fr_100px_130px_140px_80px_200px] items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>

                  {/* Hotel / Owner + plan badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900 text-sm truncate">{reg.business_name}</p>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        {PLAN_LABELS[reg.plan] ?? reg.plan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{reg.owner_name} · {reg.email}</p>
                    {reg.rejection_reason && (
                      <p className="text-[10px] text-red-500 mt-0.5 truncate">Reason: {reg.rejection_reason}</p>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 font-semibold truncate">{reg.city}</p>

                  <StatusBadge status={reg.status} />

                  <div className="text-xs font-semibold truncate">
                    {reg.whatsapp_number ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {reg.whatsapp_number}
                      </span>
                    ) : reg.phone ? (
                      <span className="text-slate-500">{reg.phone}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 font-semibold">
                    {new Date(reg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>

                  {/* Actions — single row, no wrap */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {/* View proof — icon only with tooltip */}
                    {reg.payment_proof_url ? (
                      <button onClick={() => setProofImage(reg.payment_proof_url!)}
                        title="View payment proof"
                        className="p-1.5 rounded-lg text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>
                    ) : (
                      <div className="w-7 flex-shrink-0" />
                    )}
                    <button onClick={() => handleApprove(reg)}
                      disabled={actioning || reg.status === "approved"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-30 transition-colors flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t.adminRegistrations.approve}
                    </button>
                    <button onClick={() => setRejectSheet({ reg, reason: "" })}
                      disabled={actioning || reg.status === "rejected"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-30 transition-colors flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t.adminRegistrations.reject}
                    </button>
                    <button onClick={() => handleDelete(reg.id)}
                      disabled={actioning}
                      className="p-1.5 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 transition-colors flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── MOBILE CARDS ─────────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
              {filtered.map((reg) => {
                const colors = STATUS_COLORS[reg.status] ?? STATUS_COLORS.pending_review;
                return (
                  <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{reg.business_name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0 flex items-center gap-1`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {STATUS_LABELS[reg.status] ?? reg.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{reg.owner_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{reg.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{PLAN_LABELS[reg.plan] ?? reg.plan}</p>
                          <p className="text-[10px] text-slate-300 mt-1">{new Date(reg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{reg.city}</span>
                        {reg.phone && <span className="text-[10px] text-slate-400">{reg.phone}</span>}
                        {reg.whatsapp_number && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            {reg.whatsapp_number}
                          </span>
                        )}
                      </div>
                      {reg.rejection_reason && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                          <p className="text-[11px] text-red-600"><span className="font-bold">{t.adminRegistrations.rejectionReason}</span> {reg.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex border-t border-slate-100 flex-wrap">
                      {reg.payment_proof_url && (
                        <button onClick={() => setProofImage(reg.payment_proof_url!)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-violet-600 active:bg-violet-50 border-b border-slate-100 basis-full">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          View Payment Proof
                        </button>
                      )}
                      <button onClick={() => handleApprove(reg)} disabled={actioning || reg.status === "approved"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-emerald-600 active:bg-emerald-50 disabled:opacity-30">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {t.adminRegistrations.approve}
                      </button>
                      <button onClick={() => setRejectSheet({ reg, reason: "" })} disabled={actioning || reg.status === "rejected"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-amber-600 active:bg-amber-50 border-l border-slate-100 disabled:opacity-30">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t.adminRegistrations.reject}
                      </button>
                      <button onClick={() => handleDelete(reg.id)} disabled={actioning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50 border-l border-slate-100 disabled:opacity-30">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        {t.adminRegistrations.delete}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══ REJECT MODAL — bottom sheet mobile / centered desktop ════ */}
      {rejectSheet && (
        <div className="fixed inset-0 z-[210] flex items-end md:items-center md:justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setRejectSheet(null)}>
          <div className="w-full md:w-[460px] bg-white rounded-t-3xl md:rounded-3xl"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 md:px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-slate-900 text-base">{t.adminRegistrations.rejectSheetTitle}</h3>
                <button type="button" onClick={() => setRejectSheet(null)}
                  className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {t.adminRegistrations.rejecting} <span className="font-semibold text-slate-700">{rejectSheet.reg.business_name}</span>
              </p>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">{t.adminRegistrations.reasonLabel}</label>
              <textarea
                value={rejectSheet.reason}
                onChange={(e) => setRejectSheet({ ...rejectSheet, reason: e.target.value })}
                rows={3} placeholder={t.adminRegistrations.reasonPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all resize-none" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setRejectSheet(null)}
                  className="flex-1 border border-slate-200 text-slate-600 font-black py-3 rounded-xl text-sm bg-slate-50 hover:bg-slate-100 transition-colors">
                  {t.adminRegistrations.cancel}
                </button>
                <button onClick={handleReject} disabled={actioning}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-black py-3 rounded-xl text-sm transition-colors"
                  style={{ boxShadow: "0 4px 14px rgba(239,68,68,0.28)" }}>
                  {actioning ? t.adminRegistrations.rejectingEllipsis : t.adminRegistrations.confirmRejection}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
