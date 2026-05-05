"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Hotel = { id: string; name: string; city: string; whatsapp_number: string; language_default: string; created_at: string };
const empty = { name: "", city: "", whatsapp_number: "", language_default: "en" };

export default function AdminHotels() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

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

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(h: Hotel) { setEditing(h); setForm({ name: h.name, city: h.city, whatsapp_number: h.whatsapp_number ?? "", language_default: h.language_default ?? "en" }); setShowModal(true); }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from("hotels").update(form).eq("id", editing.id);
      showToast("Hotel updated");
    } else {
      await supabase.from("hotels").insert(form);
      showToast("Hotel added");
    }
    setShowModal(false);
    setSaving(false);
    fetchHotels();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel?")) return;
    await supabase.from("hotels").delete().eq("id", id);
    showToast("Hotel deleted");
    fetchHotels();
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  return (
    <div className="p-8">
      {toast && <div className="fixed top-6 right-6 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">{toast}</div>}

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
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">{h.name.slice(0,2).toUpperCase()}</div>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? "Edit Hotel" : "Add New Hotel"}</h3>
            <div className="space-y-4">
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
                {saving ? "Saving..." : "Save Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
