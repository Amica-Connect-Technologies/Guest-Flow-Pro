"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, usersApi, type AdminUser } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const ROLES = ["superuser", "admin", "manager"];
type Form = { email: string; password: string; role: string; error: string; saving: boolean };
const blankForm = (): Form => ({ email: "", password: "", role: "manager", error: "", saving: false });

export default function AdminUsersPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const ROLE_META: Record<string, { label: string; bg: string; text: string; iconBg: string; iconColor: string }> = {
    superuser: { label: t.adminUsers.roleSuperuser, bg: "bg-purple-100", text: "text-purple-700", iconBg: "#EDE9FE", iconColor: "#7C3AED" },
    admin:     { label: t.adminUsers.roleAdmin,     bg: "bg-blue-100",   text: "text-blue-700",   iconBg: "#DBEAFE", iconColor: "#2563EB" },
    manager:   { label: t.adminUsers.roleManager,   bg: "bg-slate-100",  text: "text-slate-600",  iconBg: "#F1F5F9", iconColor: "#64748B" },
  };

  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [myId, setMyId]             = useState<number | null>(null);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState<Form>(blankForm());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast]           = useState("");

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  useEffect(() => {
    async function load() {
      try {
        const me = await auth.me();
        if (me.role !== "admin" && me.role !== "superuser") { router.push("/login"); return; }
        setMyId(me.id);
        setUsers(await usersApi.list());
      } catch { router.push("/login"); }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleCreate() {
    if (!form.email.trim() || !form.password.trim()) {
      setForm(f => ({ ...f, error: t.adminUsers.emailPasswordRequired })); return;
    }
    setForm(f => ({ ...f, saving: true, error: "" }));
    try {
      const u = await usersApi.create({ email: form.email.trim(), password: form.password.trim(), role: form.role });
      setUsers(prev => [u, ...prev]);
      setShowForm(false); setForm(blankForm()); notify(t.adminUsers.userCreated);
    } catch (e) {
      setForm(f => ({ ...f, saving: false, error: e instanceof Error ? e.message : t.adminUsers.createFailed }));
    }
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(t.adminUsers.deleteConfirm.replace("{email}", u.email))) return;
    setDeletingId(u.id);
    try {
      await usersApi.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      notify(t.adminUsers.userDeleted);
    } catch (e) { notify(e instanceof Error ? e.message : t.adminUsers.deleteFailed); }
    setDeletingId(null);
  }

  async function handleRoleChange(u: AdminUser, role: string) {
    setUpdatingId(u.id);
    try {
      const updated = await usersApi.updateRole(u.id, role);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      notify(t.adminUsers.roleUpdated);
    } catch (e) { notify(e instanceof Error ? e.message : t.adminUsers.updateFailed); }
    setUpdatingId(null);
  }

  const filtered = users.filter(u =>
    (filter === "all" || u.role === filter) &&
    (!search || u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  const UserAvatar = ({ u, size = "md" }: { u: AdminUser; size?: "sm" | "md" }) => {
    const rm = ROLE_META[u.role] ?? ROLE_META.manager;
    const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
    return (
      <div className={`${dim} rounded-xl flex items-center justify-center font-black flex-shrink-0`}
        style={{ background: rm.iconBg, color: rm.iconColor }}>
        {u.email.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const rm = ROLE_META[role] ?? { label: role, bg: "bg-slate-100", text: "text-slate-500" };
    return (
      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${rm.bg} ${rm.text}`}>{rm.label}</span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Loading users…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[300] bg-slate-900 text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold">
          {toast}
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div className="px-4 md:px-8 max-w-screen-xl">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Admin</p>
              <h1 className="font-black text-slate-900 text-base md:text-xl leading-none">{t.adminUsers.pageTitle}</h1>
            </div>
            <button onClick={() => { setShowForm(true); setForm(blankForm()); }}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.adminUsers.addUser}
            </button>
          </div>

          {/* Search + filter row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pb-3">
            <div className="relative w-full sm:max-w-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t.adminUsers.searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {["all", ...ROLES].map(r => {
                const active = filter === r;
                const count = r === "all" ? users.length : roleCounts[r] ?? 0;
                const label = r === "all" ? t.adminRegistrations.filterAll : (ROLE_META[r]?.label ?? r);
                return (
                  <button key={r} onClick={() => setFilter(r)}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl transition-colors capitalize ${
                      active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}>
                    {label}
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-28 md:pb-10 max-w-screen-xl space-y-4">

        {/* ── Stats cards (desktop only) ────────────────────────────── */}
        {users.length > 0 && (
          <div className="hidden md:grid grid-cols-4 gap-4">
            {([
              { label: "Total Users",  value: users.length,             iconBg: "#EFF6FF", iconColor: "#2563EB" },
              { label: "Superusers",   value: roleCounts.superuser ?? 0, iconBg: "#EDE9FE", iconColor: "#7C3AED" },
              { label: "Admins",       value: roleCounts.admin ?? 0,     iconBg: "#DBEAFE", iconColor: "#1D4ED8" },
              { label: "Managers",     value: roleCounts.manager ?? 0,   iconBg: "#F1F5F9", iconColor: "#475569" },
            ] as { label: string; value: number; iconBg: string; iconColor: string }[]).map(({ label, value, iconBg, iconColor }) => (
              <div key={label} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, color: iconColor }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-semibold">{t.adminUsers.noUsersFound}</p>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* ── DESKTOP TABLE ──────────────────────────────────────── */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
              {/* Header */}
              <div className="grid grid-cols-[52px_1fr_130px_160px_110px_200px] items-center gap-4 px-6 py-3 border-b border-slate-100">
                <div />
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">User</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Role</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Hotel</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Joined</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</p>
              </div>

              {filtered.map((u, i) => {
                const isMe = u.id === myId;
                return (
                  <div key={u.id}
                    className="grid grid-cols-[52px_1fr_130px_160px_110px_200px] items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>

                    <UserAvatar u={u} size="sm" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 text-sm truncate">{u.email}</p>
                        {isMe && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {t.adminUsers.you}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{u.username}</p>
                    </div>

                    <RoleBadge role={u.role} />

                    <p className="text-sm text-slate-500 font-semibold truncate">
                      {u.hotel_name ?? <span className="text-slate-300">—</span>}
                    </p>

                    <p className="text-xs text-slate-400 font-semibold">
                      {new Date(u.date_joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                    </p>

                    {/* Actions */}
                    {isMe ? (
                      <p className="text-xs text-slate-300 font-semibold text-right">{t.adminUsers.you}</p>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <div className="relative flex items-center">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id}
                            onChange={e => handleRoleChange(u, e.target.value)}
                            className="text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50 appearance-none cursor-pointer">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                          </select>
                          {updatingId === u.id ? (
                            <div className="absolute right-2.5 w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin pointer-events-none" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          )}
                        </div>
                        <button onClick={() => handleDelete(u)} disabled={deletingId === u.id}
                          className="p-1.5 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 disabled:opacity-40 transition-colors">
                          {deletingId === u.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── MOBILE CARDS ─────────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
              {filtered.map(u => {
                const rm = ROLE_META[u.role] ?? { label: u.role, bg: "bg-slate-100", text: "text-slate-600" };
                const isMe = u.id === myId;
                return (
                  <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <UserAvatar u={u} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 text-sm truncate">{u.email}</p>
                          {isMe && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">{t.adminUsers.you}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${rm.bg} ${rm.text}`}>{rm.label}</span>
                          {u.hotel_name && <span className="text-[10px] text-slate-400 font-medium">{u.hotel_name}</span>}
                          <span className="text-[10px] text-slate-300">
                            {t.adminUsers.joined} {new Date(u.date_joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isMe && (
                      <div className="flex border-t border-slate-100">
                        <div className="flex-1 flex items-center px-4 py-2.5 gap-2">
                          <span className="text-xs text-slate-400 font-medium flex-shrink-0">{t.adminUsers.role}</span>
                          <select value={u.role} disabled={updatingId === u.id}
                            onChange={e => handleRoleChange(u, e.target.value)}
                            className="flex-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 transition-colors disabled:opacity-50">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                          </select>
                          {updatingId === u.id && <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />}
                        </div>
                        <button onClick={() => handleDelete(u)} disabled={deletingId === u.id}
                          className="px-4 py-2.5 border-l border-slate-100 text-red-500 active:bg-red-50 disabled:opacity-40 transition-colors flex items-center gap-1.5 text-xs font-bold">
                          {deletingId === u.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                          {t.adminUsers.delete}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══ ADD USER MODAL — bottom sheet mobile / centered desktop ══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}>
          <div className="w-full md:w-[460px] bg-white rounded-t-3xl md:rounded-3xl"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 md:px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-slate-900 text-lg">{t.adminUsers.addNewUser}</h2>
                <button onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminUsers.emailAddress}</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value, error: "" }))}
                    placeholder={t.adminUsers.emailPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminUsers.password}</label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value, error: "" }))}
                    placeholder={t.adminUsers.passwordPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminUsers.roleLabel}</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all">
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                  </select>
                  {form.role && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      {form.role === "superuser" && t.adminUsers.roleHintSuperuser}
                      {form.role === "admin"     && t.adminUsers.roleHintAdmin}
                      {form.role === "manager"   && t.adminUsers.roleHintManager}
                    </p>
                  )}
                </div>

                {form.error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-600">{form.error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-black bg-slate-50 hover:bg-slate-100 transition-colors">
                    {t.adminUsers.cancel}
                  </button>
                  <button onClick={handleCreate} disabled={form.saving}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                    style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.28)" }}>
                    {form.saving && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    {form.saving ? t.adminUsers.creating : t.adminUsers.createUser}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
