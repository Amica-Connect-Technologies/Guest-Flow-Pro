"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, hotelsApi, servicesApi, type Hotel, type HotelService } from "@/lib/api";
import Image from "next/image";

const empty = { name: "", city: "", whatsapp_number: "", language_default: "en" };

export default function AdminHotels() {
  const router = useRouter();
  const [hotels, setHotels]           = useState<Hotel[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Hotel | null>(null);
  const [form, setForm]               = useState(empty);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState({ msg: "", error: false });
  const [search, setSearch]           = useState("");

  // Detail view
  const [viewHotel, setViewHotel]         = useState<Hotel | null>(null);
  const [viewServices, setViewServices]   = useState<HotelService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    auth.me().catch(() => router.push("/login"));
    fetchHotels();
  }, [router]);

  async function fetchHotels() {
    try { setHotels(await hotelsApi.list()); } catch { /* stay */ }
    setLoading(false);
  }

  async function openView(h: Hotel) {
    setViewHotel(h);
    setViewServices([]);
    setLoadingServices(true);
    try { setViewServices(await servicesApi.list(h.id)); } catch { /* ignore */ }
    setLoadingServices(false);
  }

  function openAdd() { setEditing(null); setForm(empty); setLogoFile(null); setLogoPreview(""); setShowModal(true); }
  function openEdit(h: Hotel) {
    setEditing(h);
    setForm({ name: h.name, city: h.city, whatsapp_number: h.whatsapp_number ?? "", language_default: h.language_default ?? "en" });
    setLogoFile(null); setLogoPreview(h.logo_url ?? ""); setShowModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("whatsapp_number", form.whatsapp_number);
      fd.append("language_default", form.language_default);
      if (logoFile) fd.append("logo", logoFile);
      if (editing) { await hotelsApi.update(editing.id, fd); }
      else { await hotelsApi.create(fd); }
      setShowModal(false); setLogoFile(null); setLogoPreview(""); fetchHotels();
      showToast(editing ? "Hotel updated" : "Hotel added");
    } catch (err) { showToast(err instanceof Error ? err.message : "Save failed", true); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel?")) return;
    try {
      await hotelsApi.delete(id);
      showToast("Hotel deleted"); fetchHotels();
      if (viewHotel?.id === id) setViewHotel(null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", true); }
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3000);
  }

  const filtered = hotels.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {toast.msg && (
        <div className={`fixed top-4 left-4 right-4 z-[300] text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold ${toast.error ? "bg-red-600" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin</p>
            <h1 className="font-bold text-slate-900 text-base leading-none">Hotels</h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Hotel
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search hotels or cities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-xs text-slate-400 font-medium px-1">{filtered.length} hotel{filtered.length !== 1 ? "s" : ""}</p>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-400 text-sm mb-3">{search ? "No hotels match your search." : "No hotels yet."}</p>
            {!search && (
              <button type="button" onClick={openAdd} className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                Add First Hotel
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((h) => (
              <div key={h.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  {h.logo_url ? (
                    <Image unoptimized src={h.logo_url} alt={h.name} width={44} height={44} className="w-11 h-11 rounded-2xl object-cover border border-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {h.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{h.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-blue-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.468-4.751 3.468-8.027A8.25 8.25 0 002.25 12c0 3.276 1.524 5.948 3.469 8.027a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        {h.city}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{h.language_default}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 flex-shrink-0">
                    {new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => openView(h)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-slate-600 border-r border-slate-50 active:bg-slate-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(h)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-blue-600 border-r border-slate-50 active:bg-blue-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(h.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-red-500 active:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Hotel Detail Sheet ───────────────────────────────── */}
      {viewHotel && (
        <div className="fixed inset-0 z-[250] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setViewHotel(null)}>
          <div
            className="w-full bg-slate-50 rounded-t-3xl max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Hero */}
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-4 mb-4">
                {viewHotel.logo_url ? (
                  <Image unoptimized src={viewHotel.logo_url} alt={viewHotel.name} width={60} height={60} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {viewHotel.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{viewHotel.name}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{viewHotel.city}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{viewHotel.language_default}</span>
                    {viewHotel.is_24_7 && (
                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">24/7</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setViewHotel(null); openEdit(viewHotel); }}
                    className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(viewHotel.id)}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Contact */}
                <div className="bg-white rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                  {viewHotel.whatsapp_number && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">WhatsApp</p>
                          <p className="text-sm font-bold text-slate-800">{viewHotel.whatsapp_number}</p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${viewHotel.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl active:scale-95"
                      >
                        Open
                      </a>
                    </div>
                  )}
                  {viewHotel.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Phone</p>
                        <p className="text-sm font-bold text-slate-800">{viewHotel.phone}</p>
                      </div>
                    </div>
                  )}
                  {viewHotel.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-purple-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Email</p>
                        <p className="text-sm font-bold text-slate-800">{viewHotel.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-white rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotel Info</p>
                  {viewHotel.description && (
                    <p className="text-sm text-slate-600 leading-relaxed">{viewHotel.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {viewHotel.address && (
                      <div className="col-span-2 bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Address</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.address}</p>
                      </div>
                    )}
                    {!viewHotel.is_24_7 && viewHotel.check_in_time && (
                      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Check-in</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.check_in_time}</p>
                      </div>
                    )}
                    {!viewHotel.is_24_7 && viewHotel.check_out_time && (
                      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Check-out</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.check_out_time}</p>
                      </div>
                    )}
                    {viewHotel.is_24_7 && (
                      <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-emerald-600 font-semibold mb-0.5">Hours</p>
                        <p className="text-xs font-bold text-emerald-700">Open 24/7</p>
                      </div>
                    )}
                    {!viewHotel.is_24_7 && viewHotel.open_time && (
                      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Opens</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.open_time}</p>
                      </div>
                    )}
                    {!viewHotel.is_24_7 && viewHotel.close_time && (
                      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Closes</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.close_time}</p>
                      </div>
                    )}
                    {viewHotel.wifi_info && (
                      <div className="col-span-2 bg-slate-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">WiFi</p>
                        <p className="text-xs font-bold text-slate-800">{viewHotel.wifi_info}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {viewHotel.amenities && viewHotel.amenities.length > 0 && (
                  <div className="bg-white rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {viewHotel.amenities.map((a) => (
                        <span key={a} className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                <div className="bg-white rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Services {!loadingServices && `(${viewServices.length})`}
                  </p>
                  {loadingServices ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    </div>
                  ) : viewServices.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No services added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {viewServices.map((svc) => (
                        <div key={svc.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                          {svc.image_url ? (
                            <Image unoptimized src={svc.image_url} alt={svc.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{svc.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{svc.category}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-slate-900">£{svc.price}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${svc.is_available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                              {svc.is_available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <p className="text-center text-[10px] text-slate-300 py-1">
                  Added {new Date(viewHotel.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[250] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-4">
              <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? "Edit Hotel" : "Add New Hotel"}</h3>

              <div className="space-y-4">
                {/* Logo upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Hotel Logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <Image unoptimized src={logoPreview} alt="Logo preview" width={56} height={56} className="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-2 rounded-xl bg-blue-50 active:scale-95">
                        {logoPreview ? "Change" : "Upload"}
                      </button>
                      {logoPreview && (
                        <button type="button" onClick={() => { setLogoPreview(""); setLogoFile(null); }} className="text-xs font-bold text-red-500 border border-red-200 px-3 py-2 rounded-xl bg-red-50 active:scale-95">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                {[
                  { label: "Hotel Name", key: "name", placeholder: "The Grand London" },
                  { label: "City", key: "city", placeholder: "London" },
                  { label: "WhatsApp Number", key: "whatsapp_number", placeholder: "+44 7700 900000" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Language</label>
                  <select
                    value={form.language_default}
                    onChange={(e) => setForm({ ...form, language_default: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {["en", "it", "fr", "de", "es", "ar", "zh", "ja"].map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl bg-slate-50 active:scale-95 text-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 disabled:opacity-60 text-white font-bold py-3 rounded-2xl active:scale-95 text-sm shadow-sm shadow-blue-200">
                  {saving ? "Saving…" : "Save Hotel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
