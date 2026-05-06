"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type Hotel = { id: string; name: string; city: string; whatsapp_number: string; language_default: string; logo_url: string; created_at: string };
const empty = { name: "", city: "", whatsapp_number: "", language_default: "en", logo_url: "" };

export default function AdminHotels() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState(empty);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
    });
    fetchHotels();
  }, [router]);

  async function fetchHotels() {
    const { data } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
    setHotels(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setLogoFile(null);
    setLogoPreview("");
    setShowModal(true);
  }

  function openEdit(h: Hotel) {
    setEditing(h);
    setForm({ name: h.name, city: h.city, whatsapp_number: h.whatsapp_number ?? "", language_default: h.language_default ?? "en", logo_url: h.logo_url ?? "" });
    setLogoFile(null);
    setLogoPreview(h.logo_url ?? "");
    setShowModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    let logo_url = form.logo_url;
    let logoWarning = "";

    if (logoFile) {
      try {
        const ext = logoFile.name.split(".").pop();
        const path = `${editing?.id ?? `new-${Date.now()}`}.${ext}`;

        const uploadPromise = supabase.storage
          .from("hotel-logos")
          .upload(path, logoFile, { upsert: true });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Upload timed out after 10s")), 10000)
        );

        const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as Awaited<typeof uploadPromise>;

        if (uploadError) {
          logoWarning = `Logo not saved: ${uploadError.message}`;
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from("hotel-logos").getPublicUrl(uploadData.path);
          logo_url = publicUrl;
        }
      } catch (e: unknown) {
        logoWarning = e instanceof Error ? `Logo not saved: ${e.message}` : "Logo upload failed";
      }
    }

    const payload = { ...form, logo_url };

    if (editing) {
      const { error } = await supabase.from("hotels").update(payload).eq("id", editing.id);
      if (error) { showToast(`Save failed: ${error.message}`, true); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("hotels").insert(payload);
      if (error) { showToast(`Save failed: ${error.message}`, true); setSaving(false); return; }
    }

    setShowModal(false);
    setSaving(false);
    setLogoFile(null);
    setLogoPreview("");
    fetchHotels();

    if (logoWarning) {
      showToast(logoWarning, true);
    } else {
      showToast(editing ? "Hotel updated" : "Hotel added");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel?")) return;
    await supabase.from("hotels").delete().eq("id", id);
    showToast("Hotel deleted");
    fetchHotels();
  }

  function showToast(msg: string, error = false) { setToast({ msg, error }); setTimeout(() => setToast({ msg: "", error: false }), 3000); }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  return (
    <div className="p-8">
      {toast.msg && <div className={`fixed top-6 right-6 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 ${toast.error ? "bg-red-600" : "bg-slate-900"}`}>{toast.msg}</div>}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotels</h1>
          <p className="text-slate-500 text-sm mt-0.5">{hotels.length} partner hotel{hotels.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-100">
          + Add Hotel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-100">
              <th className="px-6 py-3.5 font-semibold text-slate-600">Hotel Name</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">City</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">WhatsApp</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Language</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Added</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {hotels.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No hotels yet. Add your first hotel.</td></tr>
            )}
            {hotels.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {h.logo_url ? (
                      <Image unoptimized src={h.logo_url} alt={h.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">{h.name.slice(0, 2).toUpperCase()}</div>
                    )}
                    <span className="font-semibold text-slate-900">{h.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{h.city}</td>
                <td className="px-6 py-4 text-slate-500">{h.whatsapp_number || "—"}</td>
                <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg uppercase">{h.language_default}</span></td>
                <td className="px-6 py-4 text-slate-400">{new Date(h.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(h)} className="text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? "Edit Hotel" : "Add New Hotel"}</h3>
            <div className="space-y-4">

              {/* Logo upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hotel Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <Image unoptimized src={logoPreview} alt="Logo preview" width={56} height={56} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoPreview(""); setLogoFile(null); setForm({ ...form, logo_url: "" }); }}
                        className="ml-2 text-xs font-semibold text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Language</label>
                <select
                  value={form.language_default}
                  onChange={(e) => setForm({ ...form, language_default: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                >
                  {["en", "it", "fr", "de", "es", "ar", "zh", "ja"].map((l) => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {saving ? "Uploading..." : "Save Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
