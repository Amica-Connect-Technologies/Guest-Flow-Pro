"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, toursApi, type Tour } from "@/lib/api";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

const empty = { city: "", title: "", description: "", price: "", provider: "GYG", affiliate_link: "" };

export default function AdminTours() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tours, setTours] = useState<Tour[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  const [providerFilter, setProviderFilter] = useState<"all" | "GYG" | "Viator">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    auth.me().catch(() => router.push("/login"));
    fetchTours();
  }, [router]);

  async function fetchTours() {
    try { setTours(await toursApi.list()); } catch { /* stay */ }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null); setForm(empty);
    setImageFile(null); setImagePreview(""); setShowSheet(true);
  }

  function openEdit(tour: Tour) {
    setEditing(tour);
    setForm({ city: tour.city, title: tour.title, description: tour.description ?? "", price: tour.price ? String(tour.price) : "", provider: tour.provider ?? "GYG", affiliate_link: tour.affiliate_link ?? "" });
    setImageFile(null); setImagePreview(tour.image_url ?? ""); setShowSheet(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast("Tour title is required", true); return; }
    if (!form.city.trim())  { showToast("City is required", true); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("city", form.city);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("provider", form.provider);
      fd.append("affiliate_link", form.affiliate_link);
      if (form.price) fd.append("price", form.price);
      if (imageFile) fd.append("image", imageFile);
      if (editing) { await toursApi.update(editing.id, fd); }
      else { await toursApi.create(fd); }
      setShowSheet(false); setImageFile(null); setImagePreview(""); fetchTours();
      showToast(editing ? t.adminTours.tourUpdated : t.adminTours.tourAdded);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.adminTours.saveFailed, true);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.adminTours.deleteConfirm)) return;
    try { await toursApi.delete(id); showToast(t.adminTours.tourDeleted); fetchTours(); }
    catch (err) { showToast(err instanceof Error ? err.message : t.adminTours.deleteFailed, true); }
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3000);
  }

  const gygCount    = tours.filter(t => t.provider === "GYG").length;
  const viatorCount = tours.filter(t => t.provider === "Viator").length;
  const citiesCount = new Set(tours.map(t => t.city.trim().toLowerCase()).filter(Boolean)).size;

  const filtered = tours.filter((tour) => {
    const matchSearch = !search ||
      tour.title.toLowerCase().includes(search.toLowerCase()) ||
      tour.city.toLowerCase().includes(search.toLowerCase());
    const matchProvider = providerFilter === "all" || tour.provider === providerFilter;
    return matchSearch && matchProvider;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">{t.adminTours.loadingTours}</p>
      </div>
    </div>
  );

  const ProviderBadge = ({ provider }: { provider: string | null }) => (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${provider === "GYG" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
      {provider === "GYG" ? "GetYourGuide" : provider ?? "—"}
    </span>
  );

  const TourThumb = ({ tour, size = "sm" }: { tour: Tour; size?: "sm" | "md" }) => {
    const dim = size === "md" ? 72 : 52;
    const cls = size === "md" ? "w-[72px] h-[52px]" : "w-[52px] h-[52px]";
    return tour.image_url ? (
      <Image unoptimized src={tour.image_url} alt={tour.title} width={dim} height={dim}
        className={`${cls} rounded-xl object-cover flex-shrink-0`} />
    ) : (
      <div className={`${cls} rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[300] text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold ${toast.error ? "bg-red-500" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between px-4 md:px-8 h-14 md:h-16 max-w-screen-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Admin</p>
            <h1 className="font-black text-slate-900 text-base md:text-xl leading-none">{t.adminTours.pageTitle}</h1>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-black px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            style={{ boxShadow: "0 4px 14px rgba(5,150,105,0.30)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.adminTours.addTour}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-28 md:pb-10 space-y-4 max-w-screen-xl">

        {/* ── Stats cards (desktop) ───────────────────────────────────── */}
        {tours.length > 0 && (
          <div className="hidden md:grid grid-cols-4 gap-4">
            {[
              { label: "Total Tours",    value: tours.length, bg: "#ECFDF5", icon: "🗺️" },
              { label: "GetYourGuide",   value: gygCount,     bg: "#FFFBEB", icon: "🟠" },
              { label: "Viator",         value: viatorCount,  bg: "#EFF6FF", icon: "🔵" },
              { label: "Cities covered", value: citiesCount,  bg: "#F5F3FF", icon: "📍" },
            ].map(({ label, value, bg, icon }) => (
              <div key={label} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: bg }}>
                  {icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + provider filter + count ────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t.adminTours.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all" />
          </div>

          {/* Provider filter pills */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200">
            {(["all", "GYG", "Viator"] as const).map((p) => {
              const active = providerFilter === p;
              const label = p === "all" ? "All" : p === "GYG" ? "GetYourGuide" : "Viator";
              const count = p === "all" ? tours.length : p === "GYG" ? gygCount : viatorCount;
              return (
                <button key={p} onClick={() => setProviderFilter(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                  style={{
                    background: active ? (p === "GYG" ? "#FEF3C7" : p === "Viator" ? "#DBEAFE" : "#F0FDF4") : "transparent",
                    color: active ? (p === "GYG" ? "#B45309" : p === "Viator" ? "#1D4ED8" : "#065F46") : "#94A3B8",
                  }}>
                  {label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                    style={{ background: active ? "rgba(0,0,0,0.08)" : "#F1F5F9", color: "inherit" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-slate-400 font-semibold whitespace-nowrap sm:ml-auto">
            {filtered.length} {filtered.length !== 1 ? t.adminTours.packagePlural : t.adminTours.package}
          </p>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-semibold mb-3">{search ? t.adminTours.noToursMatch : t.adminTours.noToursYet}</p>
            {!search && (
              <button onClick={openAdd} className="text-sm font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                {t.adminTours.addFirstTour}
              </button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* ── DESKTOP TABLE ──────────────────────────────────────── */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
              {/* Header */}
              <div className="grid grid-cols-[64px_1fr_140px_130px_80px_100px_180px] items-center gap-4 px-6 py-3 border-b border-slate-100">
                <div />
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tour</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">City</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Provider</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Price</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Added</p>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</p>
              </div>
              {filtered.map((tour, i) => (
                <div key={tour.id}
                  className="grid grid-cols-[64px_1fr_140px_130px_80px_100px_180px] items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <TourThumb tour={tour} />
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{tour.title}</p>
                    {tour.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{tour.description}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 font-semibold truncate">{tour.city}</p>
                  <ProviderBadge provider={tour.provider ?? null} />
                  <p className="text-sm font-black text-emerald-700">
                    {tour.price ? `$${tour.price}` : <span className="text-slate-300 font-semibold text-xs">—</span>}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">
                    {new Date(tour.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end">
                    {tour.affiliate_link && (
                      <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Open link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                    <button onClick={() => openEdit(tour)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      {t.adminTours.edit}
                    </button>
                    <button onClick={() => handleDelete(tour.id)}
                      className="p-1.5 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── MOBILE CARDS ───────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
              {filtered.map((tour) => (
                <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <TourThumb tour={tour} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{tour.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{tour.description || t.adminTours.noDescription}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{tour.city}</span>
                        <ProviderBadge provider={tour.provider ?? null} />
                        {tour.price && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">${tour.price}</span>}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 flex-shrink-0 self-start mt-1">
                      {new Date(tour.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex border-t border-slate-100">
                    {tour.affiliate_link && (
                      <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-slate-500 active:bg-slate-50">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        {t.adminTours.link}
                      </a>
                    )}
                    <button onClick={() => openEdit(tour)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-blue-600 active:bg-blue-50 border-l border-slate-100">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      {t.adminTours.edit}
                    </button>
                    <button onClick={() => handleDelete(tour.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50 border-l border-slate-100">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      {t.adminTours.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL — bottom sheet mobile / centered desktop ══ */}
      {showSheet && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center md:justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSheet(false)}>
          <div className="w-full md:w-[520px] bg-white rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-5 md:px-6 pt-4 pb-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-slate-900 text-lg">
                  {editing ? t.adminTours.editTour : t.adminTours.addTourTitle}
                </h3>
                <button type="button" onClick={() => setShowSheet(false)}
                  className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Image upload */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">{t.adminTours.tourImage}</p>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <Image unoptimized src={imagePreview} alt="Preview" width={80} height={56}
                        className="w-20 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                        {imagePreview ? t.adminTours.change : t.adminTours.upload}
                      </button>
                      {imagePreview && (
                        <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); }}
                          className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
                          {t.adminTours.remove}
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                {/* Title + City side by side on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.tourTitle}</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={t.adminTours.tourTitlePlaceholder}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.city}</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder={t.adminTours.cityPlaceholder}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.description}</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder={t.adminTours.descriptionPlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all resize-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.affiliateLink}</label>
                  <input value={form.affiliate_link} onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
                    placeholder={t.adminTours.affiliateLinkPlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.priceUsd}</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="75"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">{t.adminTours.provider}</label>
                    <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all">
                      <option value="GYG">GetYourGuide</option>
                      <option value="Viator">Viator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSheet(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-black py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm">
                  {t.adminTours.cancel}
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-xl transition-colors text-sm"
                  style={{ boxShadow: "0 4px 14px rgba(5,150,105,0.28)" }}>
                  {saving ? t.adminTours.saving : t.adminTours.saveTour}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
