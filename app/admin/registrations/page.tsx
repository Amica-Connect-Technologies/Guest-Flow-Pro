"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, registrationsApi, type Registration } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending_payment: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
  pending_review:  { bg: "bg-blue-100",  text: "text-blue-700",  dot: "bg-blue-500"  },
  approved:        { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected:        { bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-400"   },
};

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
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState({ msg: "", error: false });
  const [rejectSheet, setRejectSheet] = useState<{ reg: Registration; reason: string } | null>(null);
  const [actioning, setActioning] = useState(false);

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
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.adminRegistrations.approveFailed, true);
    }
    setActioning(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.adminRegistrations.deleteConfirm)) return;
    setActioning(true);
    try {
      await registrationsApi.delete(id);
      showToast(t.adminRegistrations.deleted);
      fetchRegistrations();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.adminRegistrations.deleteFailed, true);
    }
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
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.adminRegistrations.rejectFailed, true);
    }
    setActioning(false);
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3500);
  }

  const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);
  const pendingCount = registrations.filter((r) => r.status === "pending_review").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">{t.adminRegistrations.loadingRegistrations}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {toast.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 text-white text-sm px-5 py-3 rounded-2xl shadow-xl z-[300] whitespace-nowrap ${toast.error ? "bg-red-500" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="leading-none">
            <p className="font-bold text-slate-900 text-sm">{t.adminRegistrations.pageTitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {registrations.length} {t.adminRegistrations.total}
              {pendingCount > 0 && <span className="ml-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount} {t.adminRegistrations.pending}</span>}
            </p>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[
            { key: "all", label: t.adminRegistrations.filterAll },
            { key: "pending_review", label: t.adminRegistrations.filterPending },
            { key: "approved", label: t.adminRegistrations.filterApproved },
            { key: "rejected", label: t.adminRegistrations.filterRejected },
            { key: "pending_payment", label: t.adminRegistrations.filterUnpaid },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{ touchAction: "manipulation" }}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                filter === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {label}
              {key === "pending_review" && pendingCount > 0 && (
                <span className="ml-1 bg-white/20 px-1 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-400 text-sm">{t.adminRegistrations.noRegistrations}</p>
          </div>
        ) : (
          filtered.map((reg) => {
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

                <div className="flex border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(reg)}
                    disabled={actioning || reg.status === "approved"}
                    style={{ touchAction: "manipulation" }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-emerald-600 active:bg-emerald-50 disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t.adminRegistrations.approve}
                  </button>
                  <button
                    onClick={() => setRejectSheet({ reg, reason: "" })}
                    disabled={actioning || reg.status === "rejected"}
                    style={{ touchAction: "manipulation" }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-amber-600 active:bg-amber-50 border-l border-slate-100 disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t.adminRegistrations.reject}
                  </button>
                  <button
                    onClick={() => handleDelete(reg.id)}
                    disabled={actioning}
                    style={{ touchAction: "manipulation" }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50 border-l border-slate-100 disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    {t.adminRegistrations.delete}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject reason sheet */}
      {rejectSheet && (
        <>
          <div onClick={() => setRejectSheet(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 210 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 220, background: "white", borderRadius: "24px 24px 0 0", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-1">{t.adminRegistrations.rejectSheetTitle}</h3>
              <p className="text-xs text-slate-500 mb-4">{t.adminRegistrations.rejecting} <span className="font-semibold">{rejectSheet.reg.business_name}</span></p>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">{t.adminRegistrations.reasonLabel}</label>
              <textarea
                value={rejectSheet.reason}
                onChange={(e) => setRejectSheet({ ...rejectSheet, reason: e.target.value })}
                rows={3}
                placeholder={t.adminRegistrations.reasonPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-all resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setRejectSheet(null)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm">
                  {t.adminRegistrations.cancel}
                </button>
                <button onClick={handleReject} disabled={actioning} className="flex-1 bg-red-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm">
                  {actioning ? t.adminRegistrations.rejectingEllipsis : t.adminRegistrations.confirmRejection}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
