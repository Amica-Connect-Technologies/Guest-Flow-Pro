"use client";

import { useCallback, useEffect, useState } from "react";
import { apiKeysApi, type APIKey } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const T = {
  en: {
    title: "API Keys", subtitle: "Connect external tools like n8n, Zapier, or your own apps",
    howToAuth: "How to authenticate",
    createNew: "Create New Key",
    keyNamePlaceholder: "e.g. n8n workflow, Zapier, My App...",
    generate: "Generate", creating: "Creating…",
    keyCreated: "Key created — copy it now!",
    keyWarning: "This is the only time the full key is shown. It cannot be recovered.",
    copy: "Copy", copied: "Copied!",
    noKeys: "No API keys yet",
    noKeysSub: "Generate your first key above to start integrating",
    revoke: "Revoke", activate: "Activate", deleteBtn: "Delete",
    created: "Created", lastUsed: "Last used", never: "Never",
    revoked: "Revoked",
    deleteConfirm: "Delete this API key? Any integrations using it will stop working.",
    failCreate: "Failed to create key", failUpdate: "Failed to update",
    failDelete: "Failed to delete", keyDeleted: "Key deleted",
  },
  it: {
    title: "Chiavi API", subtitle: "Collega strumenti esterni come n8n, Zapier o le tue app",
    howToAuth: "Come autenticarsi",
    createNew: "Crea Nuova Chiave",
    keyNamePlaceholder: "es. flusso n8n, Zapier, La mia App...",
    generate: "Genera", creating: "Creazione…",
    keyCreated: "Chiave creata — copiala ora!",
    keyWarning: "Questa è l'unica volta che la chiave completa viene mostrata. Non può essere recuperata.",
    copy: "Copia", copied: "Copiata!",
    noKeys: "Nessuna chiave API ancora",
    noKeysSub: "Genera la tua prima chiave qui sopra per iniziare l'integrazione",
    revoke: "Revoca", activate: "Attiva", deleteBtn: "Elimina",
    created: "Creata", lastUsed: "Ultimo utilizzo", never: "Mai",
    revoked: "Revocata",
    deleteConfirm: "Eliminare questa chiave API? Le integrazioni che la usano smetteranno di funzionare.",
    failCreate: "Creazione fallita", failUpdate: "Aggiornamento fallito",
    failDelete: "Eliminazione fallita", keyDeleted: "Chiave eliminata",
  },
  es: {
    title: "Claves API", subtitle: "Conecta herramientas externas como n8n, Zapier o tus propias apps",
    howToAuth: "Cómo autenticarse",
    createNew: "Crear Nueva Clave",
    keyNamePlaceholder: "ej. flujo n8n, Zapier, Mi App...",
    generate: "Generar", creating: "Creando…",
    keyCreated: "¡Clave creada — cópiala ahora!",
    keyWarning: "Esta es la única vez que se muestra la clave completa. No se puede recuperar.",
    copy: "Copiar", copied: "¡Copiada!",
    noKeys: "Sin claves API aún",
    noKeysSub: "Genera tu primera clave arriba para empezar a integrar",
    revoke: "Revocar", activate: "Activar", deleteBtn: "Eliminar",
    created: "Creada", lastUsed: "Último uso", never: "Nunca",
    revoked: "Revocada",
    deleteConfirm: "¿Eliminar esta clave API? Las integraciones que la usen dejarán de funcionar.",
    failCreate: "Error al crear", failUpdate: "Error al actualizar",
    failDelete: "Error al eliminar", keyDeleted: "Clave eliminada",
  },
} as const;

function fmt(d?: string | null, never = "Never") {
  if (!d) return never;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function APIKeysPage() {
  const { lang } = useLanguage();
  const t = T[lang as keyof typeof T] ?? T.en;
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ id: string; key: string } | null>(null);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [copied, setCopied] = useState(false);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try { setKeys(await apiKeysApi.list()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await apiKeysApi.create(newName.trim());
      setKeys(prev => [created, ...prev]);
      setNewName("");
      if (created.key) setRevealed({ id: created.id, key: created.key });
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? t.failCreate, false);
    }
    setCreating(false);
  }

  async function toggle(id: string, current: boolean) {
    try {
      const updated = await apiKeysApi.toggle(id, !current);
      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: updated.is_active } : k));
    } catch {
      showToast(t.failUpdate, false);
    }
  }

  async function del(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await apiKeysApi.delete(id);
      setKeys(prev => prev.filter(k => k.id !== id));
      showToast(t.keyDeleted);
    } catch {
      showToast(t.failDelete, false);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      {toast.msg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 whitespace-nowrap ${toast.ok ? "bg-slate-800" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* How to use */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t.howToAuth}</p>
          <div className="space-y-2">
            <div className="bg-slate-900/60 rounded-xl px-4 py-3 font-mono text-xs text-cyan-300">
              Authorization: Bearer gfp_your_key_here
            </div>
            <div className="bg-slate-900/60 rounded-xl px-4 py-3 font-mono text-xs text-cyan-300">
              X-API-Key: gfp_your_key_here
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Use these headers to access <span className="text-slate-300 font-mono">/api/checkin/guests/</span>,{" "}
            <span className="text-slate-300 font-mono">/api/marketing/guests/</span>, and other hotel-scoped endpoints.
          </p>
        </div>

        {/* Revealed key banner */}
        {revealed && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔑</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-emerald-400 mb-1">{t.keyCreated}</p>
                <p className="text-xs text-slate-400 mb-3">{t.keyWarning}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900/60 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-300 truncate">
                    {revealed.key}
                  </code>
                  <button onClick={() => copyKey(revealed.key)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}>
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
              </div>
              <button onClick={() => setRevealed(null)} className="text-slate-500 hover:text-white flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Create new key */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t.createNew}</p>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()}
              placeholder={t.keyNamePlaceholder}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
            />
            <button
              onClick={create}
              disabled={creating || !newName.trim()}
              className="px-5 py-3 rounded-2xl text-sm font-bold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors flex-shrink-0">
              {creating ? t.creating : t.generate}
            </button>
          </div>
        </div>

        {/* Key list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔑</p>
            <p className="text-white font-bold">{t.noKeys}</p>
            <p className="text-slate-400 text-sm mt-1">{t.noKeysSub}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${k.is_active ? "bg-emerald-400" : "bg-slate-600"}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white text-sm">{k.name}</p>
                    <code className="text-[10px] font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                      {k.key_prefix}…
                    </code>
                    {!k.is_active && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{t.revoked}</span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-0.5 text-xs text-slate-500">
                    <span>{t.created} {fmt(k.created_at, t.never)}</span>
                    <span>{t.lastUsed} {fmt(k.last_used_at, t.never)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(k.id, k.is_active)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                      k.is_active
                        ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    }`}>
                    {k.is_active ? t.revoke : t.activate}
                  </button>
                  <button
                    onClick={() => del(k.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                    {t.deleteBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
