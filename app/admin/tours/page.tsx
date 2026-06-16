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

  const filtered = tours.filter((tour) =>
    tour.title.toLowerCase().includes(search.toLowerCase()) ||
    tour.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">{t.adminTours.loadingTours}</p>
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
            <p className="font-bold text-slate-900 text-sm">{t.adminTours.pageTitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{tours.length} {tours.length !== 1 ? t.adminTours.packagePlural : t.adminTours.package}</p>
          </div>
          <button onClick={openAdd} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform" style={{ touchAction: "manipulation" }}>
            {t.adminTours.addTour}
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.adminTours.searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all" />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-400 text-sm">{search ? t.adminTours.noToursMatch : t.adminTours.noToursYet}</p>
            {!search && <button onClick={openAdd} className="inline-block mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl" style={{ touchAction: "manipulation" }}>{t.adminTours.addFirstTour}</button>}
          </div>
        ) : filtered.map((tour) => (
          <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              {tour.image_url ? (
                <Image unoptimized src={tour.image_url} alt={tour.title} width={52} height={52} className="rounded-xl object-cover flex-shrink-0" style={{ width: 52, height: 52 }} />
              ) : (
                <div className="w-[52px] h-[52px] rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{tour.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{tour.description || t.adminTours.noDescription}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{tour.city}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${tour.provider === "GYG" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{tour.provider ?? "—"}</span>
                  {tour.price ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">${tour.price}</span> : null}
                </div>
              </div>
              <p className="text-[10px] text-slate-300 flex-shrink-0 self-start mt-1">{new Date(tour.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
            </div>
            <div className="flex border-t border-slate-100">
              {tour.affiliate_link && (
                <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-slate-500 active:bg-slate-50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  {t.adminTours.link}
                </a>
              )}
              <button onClick={() => openEdit(tour)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-blue-600 active:bg-blue-50 border-l border-slate-100" style={{ touchAction: "manipulation" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                {t.adminTours.edit}
              </button>
              <button onClick={() => handleDelete(tour.id)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50 border-l border-slate-100" style={{ touchAction: "manipulation" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                {t.adminTours.delete}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showSheet && (
        <>
          <div onClick={() => setShowSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 210 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 220, background: "white", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-5">{editing ? t.adminTours.editTour : t.adminTours.addTourTitle}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">{t.adminTours.tourImage}</p>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <Image unoptimized src={imagePreview} alt="Preview" width={72} height={52} className="rounded-xl object-cover border border-slate-200 flex-shrink-0" style={{ width: 72, height: 52 }} />
                    ) : (
                      <div className="w-[72px] h-[52px] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ touchAction: "manipulation" }} className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded-xl active:scale-95 transition-transform">{imagePreview ? t.adminTours.change : t.adminTours.upload}</button>
                      {imagePreview && <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); }} style={{ touchAction: "manipulation" }} className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-3 py-2 rounded-xl active:scale-95 transition-transform">{t.adminTours.remove}</button>}
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                {([[t.adminTours.tourTitle, "title", t.adminTours.tourTitlePlaceholder], [t.adminTours.city, "city", t.adminTours.cityPlaceholder], [t.adminTours.affiliateLink, "affiliate_link", t.adminTours.affiliateLinkPlaceholder]] as const).map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
                    <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminTours.description}</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t.adminTours.descriptionPlaceholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminTours.priceUsd}</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="75" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.adminTours.provider}</label>
                    <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all">
                      <option value="GYG">GetYourGuide</option>
                      <option value="Viator">Viator</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSheet(false)} style={{ touchAction: "manipulation" }} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">{t.adminTours.cancel}</button>
                <button onClick={handleSave} disabled={saving} style={{ touchAction: "manipulation" }} className="flex-1 bg-emerald-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm">{saving ? t.adminTours.saving : t.adminTours.saveTour}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
