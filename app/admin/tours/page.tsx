"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type Tour = { id: string; city: string; title: string; description: string; image: string; price: number; provider: string; affiliate_link: string; created_at: string };
const empty = { city: "", title: "", description: "", image: "", price: "", provider: "GYG", affiliate_link: "" };

export default function AdminTours() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
    });
    fetchTours();
  }, [router]);

  async function fetchTours() {
    const { data } = await supabase.from("tours").select("*").order("created_at", { ascending: false });
    setTours(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  }

  function openEdit(t: Tour) {
    setEditing(t);
    setForm({ city: t.city, title: t.title, description: t.description ?? "", image: t.image ?? "", price: String(t.price ?? ""), provider: t.provider ?? "GYG", affiliate_link: t.affiliate_link ?? "" });
    setImageFile(null);
    setImagePreview(t.image ?? "");
    setShowModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    let image = form.image;
    let imageWarning = "";

    if (imageFile) {
      try {
        const ext = imageFile.name.split(".").pop();
        const path = `${editing?.id ?? `new-${Date.now()}`}.${ext}`;

        const uploadPromise = supabase.storage
          .from("tour-images")
          .upload(path, imageFile, { upsert: true });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Upload timed out after 10s")), 10000)
        );

        const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as Awaited<typeof uploadPromise>;

        if (uploadError) {
          imageWarning = `Image not saved: ${uploadError.message}`;
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from("tour-images").getPublicUrl(uploadData.path);
          image = publicUrl;
        }
      } catch (e: unknown) {
        imageWarning = e instanceof Error ? `Image not saved: ${e.message}` : "Image upload failed";
      }
    }

    const payload = { ...form, image, price: form.price ? parseFloat(form.price) : null };

    if (editing) {
      const { error } = await supabase.from("tours").update(payload).eq("id", editing.id);
      if (error) { showToast(`Save failed: ${error.message}`, true); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("tours").insert(payload);
      if (error) { showToast(`Save failed: ${error.message}`, true); setSaving(false); return; }
    }

    setShowModal(false);
    setSaving(false);
    setImageFile(null);
    setImagePreview("");
    fetchTours();

    if (imageWarning) showToast(imageWarning, true);
    else showToast(editing ? "Tour updated" : "Tour added");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tour?")) return;
    await supabase.from("tours").delete().eq("id", id);
    showToast("Tour deleted");
    fetchTours();
  }

  function showToast(msg: string, error = false) { setToast({ msg, error }); setTimeout(() => setToast({ msg: "", error: false }), 3000); }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  return (
    <div className="p-8">
      {toast.msg && (
        <div className={`fixed top-6 right-6 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 ${toast.error ? "bg-red-600" : "bg-slate-900"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tours</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tours.length} tour package{tours.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-100">
          + Add Tour
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-100">
              <th className="px-6 py-3.5 font-semibold text-slate-600">Tour</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">City</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Price</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Provider</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Added</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tours.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No tours yet.</td></tr>
            )}
            {tours.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {t.image ? (
                      <Image unoptimized src={t.image} alt={t.title} width={40} height={40} className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-emerald-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{t.city}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{t.price ? `$${t.price}` : "—"}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${t.provider === "GYG" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                    {t.provider ?? "—"}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? "Edit Tour" : "Add New Tour"}</h3>
            <div className="space-y-4">

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tour Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <Image unoptimized src={imagePreview} alt="Preview" width={80} height={56} className="w-20 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-20 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </button>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); setForm({ ...form, image: "" }); }}
                        className="ml-2 text-xs font-semibold text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {[
                { label: "Tour Title", key: "title", placeholder: "Burj Khalifa Guided Tour" },
                { label: "City", key: "city", placeholder: "Dubai" },
                { label: "Affiliate Link", key: "affiliate_link", placeholder: "https://www.getyourguide.com/..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief tour description..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price (USD)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Provider</label>
                  <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all">
                    <option value="GYG">GetYourGuide</option>
                    <option value="Viator">Viator</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {saving ? "Saving..." : "Save Tour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
