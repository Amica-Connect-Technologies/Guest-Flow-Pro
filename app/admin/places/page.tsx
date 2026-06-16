"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, placesApi, type Place } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const IMPORT_TYPES = ["restaurant", "cafe", "nightlife", "parking", "museum"];

const TYPES = ["restaurant", "museum", "cafe", "attraction", "shop", "parking", "nightlife", "other"];
const empty = { city: "", name: "", type: "restaurant", description: "", address: "", google_maps_link: "" };

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  restaurant: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  museum:     { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  cafe:       { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  attraction: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  shop:       { bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500" },
  other:      { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400"  },
};

export default function AdminPlaces() {
  const router = useRouter();
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  const [showImport, setShowImport] = useState(false);
  const [importCity, setImportCity] = useState("");
  const [importType, setImportType] = useState("restaurant");
  const [importLimit, setImportLimit] = useState(50);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    auth.me().catch(() => router.push("/login"));
    fetchPlaces();
  }, [router]);

  async function fetchPlaces() {
    try { setPlaces(await placesApi.list()); } catch { /* stay */ }
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(empty); setShowSheet(true); }
  function openEdit(p: Place) {
    setEditing(p);
    setForm({ city: p.city, name: p.name, type: p.type ?? "restaurant", description: p.description ?? "", address: p.address ?? "", google_maps_link: p.google_maps_link ?? "" });
    setShowSheet(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await placesApi.update(editing.id, form); showToast(t.adminPlaces.placeUpdated); }
      else { await placesApi.create(form); showToast(t.adminPlaces.placeAdded); }
      setShowSheet(false); fetchPlaces();
    } catch (err) { showToast(err instanceof Error ? err.message : t.adminPlaces.saveFailed, true); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.adminPlaces.deleteConfirm)) return;
    try { await placesApi.delete(id); showToast(t.adminPlaces.placeDeleted); fetchPlaces(); }
    catch (err) { showToast(err instanceof Error ? err.message : t.adminPlaces.deleteFailed, true); }
  }

  async function handleImport() {
    if (!importCity.trim()) return;
    setImporting(true);
    try {
      const res = await placesApi.import(importCity.trim(), importType, importLimit);
      showToast(t.adminPlaces.importSuccess.replace("{created}", String(res.created)).replace("{skipped}", String(res.skipped)));
      setShowImport(false);
      fetchPlaces();
    } catch (err) { showToast(err instanceof Error ? err.message : t.adminPlaces.importFailed, true); }
    setImporting(false);
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3000);
  }

  const filtered = places.filter((p) => {
    const matchType = filter === "all" || p.type === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">{t.adminPlaces.loadingPlaces}</p>
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

      <div className="sticky top-0 z-40 bg-white border-b border-slate-100" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="leading-none">
            <p className="font-bold text-slate-900 text-sm">{t.adminPlaces.pageTitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{places.length} {places.length !== 1 ? t.adminPlaces.placePlural : t.adminPlaces.place}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5" style={{ touchAction: "manipulation" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              {t.adminPlaces.import}
            </button>
            <button onClick={openAdd} className="bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform" style={{ touchAction: "manipulation" }}>
              {t.adminPlaces.add}
            </button>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.adminPlaces.searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all" />
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {["all", ...TYPES].map((type) => (
            <button key={type} onClick={() => setFilter(type)} style={{ touchAction: "manipulation" }}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl capitalize transition-colors ${filter === type ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-400 text-sm">{search || filter !== "all" ? t.adminPlaces.noPlacesMatch : t.adminPlaces.noPlacesYet}</p>
            {!search && filter === "all" && <button onClick={openAdd} style={{ touchAction: "manipulation" }} className="inline-block mt-3 text-xs font-bold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl">{t.adminPlaces.addFirstPlace}</button>}
          </div>
        ) : filtered.map((p) => {
          const colors = typeColors[p.type] ?? typeColors.other;
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{p.description || t.adminPlaces.noDescription}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{p.city}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize ${colors.bg} ${colors.text}`}>{p.type}</span>
                    {p.address && <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.address}</span>}
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 flex-shrink-0">{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
              </div>
              <div className="flex border-t border-slate-100">
                {p.google_maps_link && (
                  <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-slate-500 active:bg-slate-50">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {t.adminPlaces.map}
                  </a>
                )}
                <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-blue-600 active:bg-blue-50 border-l border-slate-100" style={{ touchAction: "manipulation" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                  {t.adminPlaces.edit}
                </button>
                <button onClick={() => handleDelete(p.id)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50 border-l border-slate-100" style={{ touchAction: "manipulation" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  {t.adminPlaces.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showSheet && (
        <>
          <div onClick={() => setShowSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 210 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 220, background: "white", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-5">{editing ? t.adminPlaces.editPlace : t.adminPlaces.addPlaceTitle}</h3>
              <div className="space-y-4">
                {([[t.adminPlaces.placeName, "name", t.adminPlaces.placeNamePlaceholder], [t.adminPlaces.city, "city", t.adminPlaces.cityPlaceholder], [t.adminPlaces.address, "address", t.adminPlaces.addressPlaceholder], [t.adminPlaces.googleMapsLink, "google_maps_link", t.adminPlaces.googleMapsLinkPlaceholder]] as const).map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
                    <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminPlaces.type}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition-all capitalize">
                    {TYPES.map((type) => <option key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminPlaces.description}</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t.adminPlaces.descriptionPlaceholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSheet(false)} style={{ touchAction: "manipulation" }} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">{t.adminPlaces.cancel}</button>
                <button onClick={handleSave} disabled={saving} style={{ touchAction: "manipulation" }} className="flex-1 bg-violet-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">{saving ? t.adminPlaces.saving : t.adminPlaces.savePlace}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Import from OpenStreetMap sheet ── */}
      {showImport && (
        <>
          <div onClick={() => setShowImport(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 210 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 220, background: "white", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{t.adminPlaces.importTitle}</p>
                  <p className="text-xs text-slate-400">{t.adminPlaces.importSubtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* City */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminPlaces.cityName}</label>
                  <input
                    value={importCity} onChange={e => setImportCity(e.target.value)}
                    placeholder={t.adminPlaces.cityNamePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{t.adminPlaces.cityNameHint}</p>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminPlaces.placeType}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {IMPORT_TYPES.map(type => (
                      <button key={type} onClick={() => setImportType(type)} style={{ touchAction: "manipulation" }}
                        className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-colors ${importType === type ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limit */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminPlaces.maxResults} <span className="text-emerald-600">{importLimit}</span></label>
                  <input type="range" min={10} max={200} step={10} value={importLimit} onChange={e => setImportLimit(Number(e.target.value))}
                    className="w-full accent-emerald-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>10</span><span>200</span></div>
                </div>

                {/* Info box */}
                <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} className="w-4 h-4 mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  <p className="text-xs text-emerald-700">{t.adminPlaces.importInfo}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowImport(false)} style={{ touchAction: "manipulation" }} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">{t.adminPlaces.cancel}</button>
                <button onClick={handleImport} disabled={importing || !importCity.trim()} style={{ touchAction: "manipulation" }} className="flex-1 bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">
                  {importing ? t.adminPlaces.importing : `${t.adminPlaces.importAction} ${importType}s`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
