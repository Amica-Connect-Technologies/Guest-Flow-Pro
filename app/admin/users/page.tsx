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

  const ROLE_META: Record<string, { label: string; bg: string; text: string }> = {
    superuser: { label: t.adminUsers.roleSuperuser, bg: "bg-purple-100", text: "text-purple-700" },
    admin:     { label: t.adminUsers.roleAdmin,     bg: "bg-blue-100",   text: "text-blue-700"   },
    manager:   { label: t.adminUsers.roleManager,   bg: "bg-slate-100",  text: "text-slate-600"  },
  };

  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [myId, setMyId]         = useState<number | null>(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<Form>(blankForm());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast]       = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    async function load() {
      try {
        const me = await auth.me();
        if (me.role !== "admin" && me.role !== "superuser") { router.push("/login"); return; }
        setMyId(me.id);
        const list = await usersApi.list();
        setUsers(list);
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
      setShowForm(false);
      setForm(blankForm());
      notify(t.adminUsers.userCreated);
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
    } catch (e) {
      notify(e instanceof Error ? e.message : t.adminUsers.deleteFailed);
    }
    setDeletingId(null);
  }

  async function handleRoleChange(u: AdminUser, role: string) {
    setUpdatingId(u.id);
    try {
      const updated = await usersApi.updateRole(u.id, role);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      notify(t.adminUsers.roleUpdated);
    } catch (e) {
      notify(e instanceof Error ? e.message : t.adminUsers.updateFailed);
    }
    setUpdatingId(null);
  }

  const filtered = users.filter(u =>
    (filter === "all" || u.role === filter) &&
    (search === "" || u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-bold text-slate-900 text-lg">{t.adminUsers.pageTitle}</h1>
            <p className="text-xs text-slate-400">{users.length} {t.adminUsers.total}</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm(blankForm()); }}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.adminUsers.addUser}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.adminUsers.searchPlaceholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 transition-colors" />
        </div>

        {/* Role filter chips */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {["all", ...ROLES].map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full capitalize transition-all ${filter === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {r === "all" ? t.adminUsers.allWithCount.replace("{count}", String(users.length)) : `${ROLE_META[r]?.label ?? r} (${roleCounts[r] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-slate-200 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="font-semibold text-slate-500 text-sm">{t.adminUsers.noUsersFound}</p>
          </div>
        ) : filtered.map(u => {
          const rm = ROLE_META[u.role] ?? { label: u.role, bg: "bg-slate-100", text: "text-slate-600" };
          const isMe = u.id === myId;
          return (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                  u.role === "superuser" ? "bg-purple-100 text-purple-600" :
                  u.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {u.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm truncate">{u.email}</p>
                    {isMe && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">{t.adminUsers.you}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rm.bg} ${rm.text}`}>{rm.label}</span>
                    {u.hotel_name && (
                      <span className="text-[10px] text-slate-400 font-medium">{u.hotel_name}</span>
                    )}
                    <span className="text-[10px] text-slate-300">
                      {t.adminUsers.joined} {new Date(u.date_joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isMe && (
                <div className="flex border-t border-slate-100">
                  {/* Role selector */}
                  <div className="flex-1 flex items-center px-4 py-2.5 gap-2">
                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">{t.adminUsers.role}</span>
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={e => handleRoleChange(u, e.target.value)}
                      className="flex-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 transition-colors disabled:opacity-50">
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
                      ))}
                    </select>
                    {updatingId === u.id && (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                    )}
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deletingId === u.id}
                    className="px-4 py-2.5 border-l border-slate-100 text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors flex items-center gap-1.5 text-xs font-bold">
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

      {/* Add User modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">{t.adminUsers.addNewUser}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">{t.adminUsers.emailAddress}</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value, error: "" }))}
                  placeholder={t.adminUsers.emailPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">{t.adminUsers.password}</label>
                <input
                  type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value, error: "" }))}
                  placeholder={t.adminUsers.passwordPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">{t.adminUsers.roleLabel}</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 transition-colors">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  {form.role === "superuser" && t.adminUsers.roleHintSuperuser}
                  {form.role === "admin" && t.adminUsers.roleHintAdmin}
                  {form.role === "manager" && t.adminUsers.roleHintManager}
                </p>
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
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                  {t.adminUsers.cancel}
                </button>
                <button onClick={handleCreate} disabled={form.saving}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {form.saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
                  {form.saving ? t.adminUsers.creating : t.adminUsers.createUser}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
