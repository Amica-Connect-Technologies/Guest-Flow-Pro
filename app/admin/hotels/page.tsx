"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, hotelsApi, galleryApi, type Hotel, type HotelGalleryImage } from "@/lib/api";
import Image from "next/image";

const PLANS = [
  { value: "concierge",         label: "Digital Concierge",    price: "£25/mo", color: "blue"   },
  { value: "checkin",           label: "Smart Check-in",       price: "£50/mo", color: "violet" },
  { value: "concierge_checkin", label: "Guest Experience Pro", price: "£75/mo", color: "amber"  },
  { value: "full",              label: "Full Suite",           price: "£100/mo", color: "green" },
];
const PLAN_COLORS: Record<string, string> = {
  concierge:         "bg-blue-100 text-blue-700",
  checkin:           "bg-violet-100 text-violet-700",
  concierge_checkin: "bg-amber-100 text-amber-700",
  full:              "bg-emerald-100 text-emerald-700",
};
const PLAN_LABEL: Record<string, string> = {
  concierge:         "£25 Concierge",
  checkin:           "£50 Smart Check-in",
  concierge_checkin: "£75 Guest Exp. Pro",
  full:              "£100 Full Suite",
  starter: "Starter (Legacy)", pro: "Pro (Legacy)", enterprise: "Enterprise (Legacy)",
};

const COUNTRIES = ["Italy", "United Kingdom", "Spain", "France", "Germany", "Other"];
const AMENITY_OPTIONS = [
  "Free WiFi", "Parking", "Pool", "Spa", "Gym", "Restaurant", "Bar",
  "Room Service", "Airport Shuttle", "Concierge", "Laundry", "Pet Friendly",
  "Air Conditioning", "Sea View", "City View", "Garden", "Terrace", "Business Center",
];

type Form = {
  name: string; city: string; country: string;
  phone: string; email: string; whatsapp_number: string; website: string;
  description: string; address: string;
  check_in_time: string; check_out_time: string; wifi_info: string;
  is_24_7: boolean; language_default: string;
  plan: string; is_verified: boolean;
  amenities: string[];
};

const emptyForm: Form = {
  name: "", city: "", country: "Italy",
  phone: "", email: "", whatsapp_number: "", website: "",
  description: "", address: "",
  check_in_time: "14:00", check_out_time: "11:00", wifi_info: "",
  is_24_7: false, language_default: "it",
  plan: "concierge", is_verified: false,
  amenities: [],
};

export default function AdminHotels() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<HotelGalleryImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("All");
  const [viewHotel, setViewHotel] = useState<Hotel | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const logoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    auth.me().catch(() => router.push("/login"));
    fetchHotels();
  }, [router]);

  async function fetchHotels() {
    try { setHotels(await hotelsApi.list()); } catch { /* stay */ }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null); setLogoPreview("");
    setGalleryFiles([]); setGalleryPreviews([]); setExistingGallery([]);
    setActiveTab("basic");
    setShowModal(true);
  }

  function openEdit(h: Hotel) {
    setEditing(h);
    setForm({
      name: h.name, city: h.city, country: h.country || "Italy",
      phone: h.phone || "", email: h.email || "",
      whatsapp_number: h.whatsapp_number || "", website: h.website || "",
      description: h.description || "", address: h.address || "",
      check_in_time: h.check_in_time || "14:00", check_out_time: h.check_out_time || "11:00",
      wifi_info: h.wifi_info || "",
      is_24_7: h.is_24_7 || false, language_default: h.language_default || "it",
      plan: h.plan || "concierge", is_verified: h.is_verified || false,
      amenities: h.amenities || [],
    });
    setLogoFile(null); setLogoPreview(h.logo_url || "");
    setGalleryFiles([]); setGalleryPreviews([]);
    setExistingGallery(h.gallery_images || []);
    setActiveTab("basic");
    setShowModal(true);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - existingGallery.length - galleryFiles.length;
    const toAdd = files.slice(0, maxNew);
    setGalleryFiles(prev => [...prev, ...toAdd]);
    setGalleryPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewGallery(idx: number) {
    setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function removeExistingGallery(imgId: string) {
    try {
      await galleryApi.adminDelete(imgId);
      setExistingGallery(prev => prev.filter(g => g.id !== imgId));
    } catch { showToast("Failed to remove image", true); }
  }

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.city.trim()) {
      showToast("Name and city are required", true); return;
    }
    if (!editing && incompleteTabs.length > 0) {
      setActiveTab(incompleteTabs[0].id);
      showToast(`Please complete "${incompleteTabs[0].label}" before adding this hotel`, true);
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      (Object.keys(form) as (keyof Form)[]).forEach(k => {
        const v = form[k];
        if (k === "amenities") fd.append("amenities", JSON.stringify(v));
        else if (k === "is_24_7" || k === "is_verified") fd.append(k, String(v));
        else fd.append(k, String(v));
      });
      if (logoFile) fd.append("logo", logoFile);

      let saved: Hotel;
      if (editing) { saved = await hotelsApi.update(editing.id, fd); }
      else { saved = await hotelsApi.create(fd); }

      // Upload new gallery images
      for (const file of galleryFiles) {
        try { await galleryApi.adminUpload(saved.id, file); } catch { /* continue */ }
      }

      setShowModal(false);
      fetchHotels();
      showToast(editing ? "Hotel updated" : "Hotel added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", true);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel? This cannot be undone.")) return;
    try {
      await hotelsApi.delete(id);
      showToast("Hotel deleted");
      fetchHotels();
      if (viewHotel?.id === id) setViewHotel(null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", true); }
  }

  async function toggleVerify(h: Hotel) {
    try {
      const fd = new FormData();
      fd.append("is_verified", String(!h.is_verified));
      await hotelsApi.update(h.id, fd);
      showToast(h.is_verified ? "Unverified" : "Verified ✓");
      fetchHotels();
      if (viewHotel?.id === h.id) setViewHotel({ ...viewHotel, is_verified: !h.is_verified });
    } catch { showToast("Failed to update verification", true); }
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3000);
  }

  const countries = ["All", "Italy", "United Kingdom", "Spain", "Other"];
  const filtered = hotels.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
    const matchCountry = filterCountry === "All" || (h.country || "Italy") === filterCountry;
    return matchSearch && matchCountry;
  });

  const totalSlots = existingGallery.length + galleryFiles.length;

  const TABS = [
    { id: "basic", label: "Basic Info" },
    { id: "contact", label: "Contact" },
    { id: "details", label: "Details" },
    { id: "gallery", label: `Gallery (${totalSlots}/5)` },
    { id: "plan", label: "Plan & Status" },
  ];

  // Which fields must be filled per step before a new hotel can be added.
  // (Editing an existing hotel is never blocked — legacy records may predate these rules.)
  const TAB_COMPLETE: Record<string, boolean> = {
    basic: !!form.name.trim() && !!form.city.trim() && !!form.description.trim(),
    contact: !!form.phone.trim() && !!form.email.trim() && !!form.whatsapp_number.trim(),
    details: form.amenities.length > 0,
    gallery: totalSlots > 0,
    plan: true, // a plan is always selected by default
  };
  const incompleteTabs = TABS.filter(t => !TAB_COMPLETE[t.id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[300] text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold ${toast.error ? "bg-red-600" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-4 md:px-8 h-14 md:h-16 max-w-screen-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Admin</p>
            <h1 className="font-black text-slate-900 text-base md:text-xl leading-none">Hotel Management</h1>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Hotel
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-28 md:pb-10 space-y-4 max-w-screen-xl">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Search hotels..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1.5">
            {countries.map(c => (
              <button key={c} onClick={() => setFilterCountry(c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${filterCountry === c ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                {c}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400 font-semibold whitespace-nowrap">
            {filtered.length} hotel{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANS.map(p => {
            const count = hotels.filter(h => h.plan === p.value).length;
            return (
              <div key={p.value} className="bg-white rounded-2xl px-4 py-3 border border-slate-100">
                <p className={`text-[10px] font-black uppercase tracking-widest ${PLAN_COLORS[p.value].split(" ")[1]}`}>{p.price}</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 font-variant-numeric tabular-nums">{count}</p>
                <p className="text-xs text-slate-400 font-semibold">{p.label}</p>
              </div>
            );
          })}
        </div>

        {/* Hotel Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <p className="text-slate-400 text-sm font-semibold mb-3">{search ? "No hotels match your search" : "No hotels yet"}</p>
            {!search && (
              <button onClick={openAdd} className="text-sm font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">
                Add First Hotel
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(h => (
              <div key={h.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Gallery preview */}
                {h.gallery_images && h.gallery_images.length > 0 ? (
                  <div className="h-40 relative overflow-hidden">
                    <Image unoptimized src={h.gallery_images[0].image_url} alt={h.name} fill className="object-cover" />
                    {h.gallery_images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{h.gallery_images.length - 1}
                      </div>
                    )}
                    {h.is_verified && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Verified
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    <span className="text-5xl opacity-30">🏨</span>
                    {h.is_verified && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">✓ Verified</div>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {h.logo_url ? (
                      <Image unoptimized src={h.logo_url} alt={h.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {h.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{h.name}</p>
                      <p className="text-xs text-slate-400">{h.city}, {h.country || "Italy"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${PLAN_COLORS[h.plan] ?? "bg-slate-100 text-slate-500"}`}>
                      {PLAN_LABEL[h.plan] ?? h.plan}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {h.is_verified ? "✓ Verified" : "Unverified"}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button onClick={() => setViewHotel(h)}
                      className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors">
                      View
                    </button>
                    <button onClick={() => openEdit(h)}
                      className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleVerify(h)}
                      className={`px-3 text-xs font-bold py-2 rounded-xl transition-colors ${h.is_verified ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"}`}>
                      {h.is_verified ? "Unverify" : "Verify"}
                    </button>
                    <button onClick={() => handleDelete(h.id)}
                      className="px-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hotel Detail Modal */}
      {viewHotel && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center md:justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setViewHotel(null)}>
          <div className="w-full md:w-[680px] bg-slate-50 rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 pt-4 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-lg">{viewHotel.name}</h3>
                <button onClick={() => setViewHotel(null)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {viewHotel.gallery_images && viewHotel.gallery_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {viewHotel.gallery_images.map(img => (
                    <Image unoptimized key={img.id} src={img.image_url} alt="" width={120} height={80}
                      className="w-30 h-20 rounded-xl object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Location</p>
                  <p className="font-bold text-slate-800 text-sm">{viewHotel.city}</p>
                  <p className="text-xs text-slate-500">{viewHotel.country}</p>
                  {viewHotel.address && <p className="text-xs text-slate-400 mt-1">{viewHotel.address}</p>}
                </div>
                <div className="bg-white rounded-2xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Plan</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${PLAN_COLORS[viewHotel.plan] ?? "bg-slate-100 text-slate-500"}`}>
                    {PLAN_LABEL[viewHotel.plan] ?? viewHotel.plan}
                  </span>
                  <div className="mt-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${viewHotel.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {viewHotel.is_verified ? "✓ Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
                {viewHotel.phone && (
                  <div className="bg-white rounded-2xl p-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Phone</p>
                    <p className="text-sm font-bold text-slate-800">{viewHotel.phone}</p>
                  </div>
                )}
                {viewHotel.email && (
                  <div className="bg-white rounded-2xl p-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{viewHotel.email}</p>
                  </div>
                )}
              </div>
              {viewHotel.description && (
                <div className="bg-white rounded-2xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Description</p>
                  <p className="text-sm text-slate-600">{viewHotel.description}</p>
                </div>
              )}
              {viewHotel.amenities && viewHotel.amenities.length > 0 && (
                <div className="bg-white rounded-2xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewHotel.amenities.map(a => (
                      <span key={a} className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setViewHotel(null); openEdit(viewHotel); }}
                  className="flex-1 bg-blue-600 text-white font-black py-3 rounded-2xl text-sm hover:bg-blue-700 transition-colors">
                  Edit Hotel
                </button>
                <button onClick={() => toggleVerify(viewHotel)}
                  className={`flex-1 font-black py-3 rounded-2xl text-sm transition-colors ${viewHotel.is_verified ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                  {viewHotel.is_verified ? "Unverify" : "✓ Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center md:justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full md:w-[600px] bg-white rounded-t-3xl md:rounded-3xl max-h-[94vh] flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-black text-slate-900 text-lg">
                {editing ? "Edit Hotel" : "Add New Hotel"}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 flex-shrink-0 overflow-x-auto">
              {TABS.map(tab => {
                const complete = TAB_COMPLETE[tab.id];
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                    {!editing && (
                      complete
                        ? <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
                        : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {!editing && incompleteTabs.length > 0 && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-[11px] font-bold text-amber-700 flex-shrink-0">
                Complete all 5 steps to add this hotel — {incompleteTabs.length} step{incompleteTabs.length > 1 ? "s" : ""} remaining
              </div>
            )}

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Basic Info */}
              {activeTab === "basic" && (
                <>
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Hotel Logo</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <Image unoptimized src={logoPreview} alt="Logo" width={56} height={56} className="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl">🏨</div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => logoRef.current?.click()}
                          className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                          {logoPreview ? "Change" : "Upload"}
                        </button>
                        {logoPreview && (
                          <button onClick={() => { setLogoPreview(""); setLogoFile(null); }}
                            className="text-xs font-bold text-red-500 border border-red-200 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </div>

                  <Field label="Hotel Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Grand Hotel Roma" />

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City *" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="e.g. Rome" />
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Country</label>
                      <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Language</label>
                    <select value={form.language_default} onChange={e => setForm(f => ({ ...f, language_default: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500">
                      {["en", "it", "es", "fr", "de"].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Hotel description visible to guests..."
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
                  </div>
                </>
              )}

              {/* Contact */}
              {activeTab === "contact" && (
                <>
                  <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+39 06 1234 5678" type="tel" />
                  <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="info@hotel.com" type="email" />
                  <Field label="WhatsApp Number" value={form.whatsapp_number} onChange={v => setForm(f => ({ ...f, whatsapp_number: v }))} placeholder="+39 333 123 4567" />
                  <Field label="Website" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="https://www.hotel.com" type="url" />
                  <Field label="Full Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Via della Repubblica 14, 00185 Roma" />
                </>
              )}

              {/* Details */}
              {activeTab === "details" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Check-in Time" value={form.check_in_time} onChange={v => setForm(f => ({ ...f, check_in_time: v }))} type="time" />
                    <Field label="Check-out Time" value={form.check_out_time} onChange={v => setForm(f => ({ ...f, check_out_time: v }))} type="time" />
                  </div>

                  <Field label="WiFi Info" value={form.wifi_info} onChange={v => setForm(f => ({ ...f, wifi_info: v }))} placeholder="Network: GrandHotel | Pass: welcome2024" />

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Open 24/7</p>
                      <p className="text-xs text-slate-400">Reception available around the clock</p>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, is_24_7: !f.is_24_7 }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.is_24_7 ? "bg-blue-600" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_24_7 ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITY_OPTIONS.map(a => (
                        <button key={a} onClick={() => toggleAmenity(a)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${form.amenities.includes(a) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                    {form.amenities.length > 0 && (
                      <p className="text-xs text-blue-600 mt-2 font-semibold">{form.amenities.length} selected</p>
                    )}
                  </div>
                </>
              )}

              {/* Gallery */}
              {activeTab === "gallery" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Upload up to 5 photos. These appear on the hotel public page.</p>

                  {/* Existing gallery */}
                  {existingGallery.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase mb-2">Current Photos ({existingGallery.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {existingGallery.map(img => (
                          <div key={img.id} className="relative group aspect-video rounded-xl overflow-hidden">
                            <Image unoptimized src={img.image_url} alt="" fill className="object-cover" />
                            <button onClick={() => removeExistingGallery(img.id)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-black text-sm bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New uploads */}
                  {galleryPreviews.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase mb-2">New Photos ({galleryPreviews.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {galleryPreviews.map((src, i) => (
                          <div key={i} className="relative group aspect-video rounded-xl overflow-hidden">
                            <Image unoptimized src={src} alt="" fill className="object-cover" />
                            <button onClick={() => removeNewGallery(i)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-black text-sm bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalSlots < 5 && (
                    <button onClick={() => galleryRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-sm font-bold">Add Photos ({5 - totalSlots} remaining)</p>
                      <p className="text-xs">Click to browse</p>
                    </button>
                  )}
                  {totalSlots >= 5 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-semibold">
                      Maximum 5 photos reached. Remove one to add another.
                    </div>
                  )}
                  <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                </div>
              )}

              {/* Plan & Status */}
              {activeTab === "plan" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-3">Subscription Plan</label>
                    <div className="space-y-2">
                      {PLANS.map(p => (
                        <button key={p.value} onClick={() => setForm(f => ({ ...f, plan: p.value }))}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${form.plan === p.value ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                          <div>
                            <p className={`font-black text-sm ${form.plan === p.value ? "text-blue-700" : "text-slate-800"}`}>{p.label}</p>
                          </div>
                          <span className={`text-sm font-black ${form.plan === p.value ? "text-blue-600" : "text-slate-400"}`}>{p.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Hotel Verified</p>
                      <p className="text-xs text-slate-400">Verified hotels display on the public site</p>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, is_verified: !f.is_verified }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.is_verified ? "bg-emerald-500" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_verified ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {form.is_verified && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-semibold flex items-center gap-2">
                      <span className="text-lg">✓</span> This hotel will appear on the public site
                    </div>
                  )}
                  {!form.is_verified && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-semibold flex items-center gap-2">
                      <span className="text-lg">⚠</span> Hotel is hidden — verify to display publicly
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-black py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || (!editing && incompleteTabs.length > 0)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors text-sm"
                style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : incompleteTabs.length > 0 ? `${5 - incompleteTabs.length}/5 steps done` : "Add Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder = "", type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
      />
    </div>
  );
}
