"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tour = { id: string; city: string; title: string; description: string; price: number; provider: string; affiliate_link: string; created_at: string };
const empty = { city: "", title: "", description: "", price: "", provider: "GYG", affiliate_link: "" };

export default function AdminTours() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

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

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(t: Tour) {
    setEditing(t);
    setForm({ city: t.city, title: t.title, description: t.description ?? "", price: String(t.price ?? ""), provider: t.provider ?? "GYG", affiliate_link: t.affiliate_link ?? "" });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, price: form.price ? parseFloat(form.price) : null };
    if (editing) {
      await supabase.from("tours").update(payload).eq("id", editing.id);
      showToast("Tour updated");
    } else {
      await supabase.from("tours").insert(payload);
      showToast("Tour added");
    }
    setShowModal(false);
    setSaving(false);
    fetchTours();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tour?")) return;
    await supabase.from("tours").delete().eq("id", id);
    showToast("Tour deleted");
    fetchTours();
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  return (
    <div className="p-8">
      {toast && <div className="fixed top-6 right-6 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">{toast}</div>}

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
              <th className="px-6 py-3.5 font-semibold text-slate-600">Title</th>
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
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
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
