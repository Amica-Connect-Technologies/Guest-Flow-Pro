"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Place = { id: string; city: string; name: string; type: string; description: string; address: string; google_maps_link: string; created_at: string };
const TYPES = ["restaurant", "museum", "cafe", "attraction", "shop", "other"];
const empty = { city: "", name: "", type: "restaurant", description: "", address: "", google_maps_link: "" };

const typeColors: Record<string, string> = {
  restaurant: "bg-orange-100 text-orange-700",
  museum: "bg-violet-100 text-violet-700",
  cafe: "bg-amber-100 text-amber-700",
  attraction: "bg-blue-100 text-blue-700",
  shop: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-600",
};

export default function AdminPlaces() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
    });
    fetchPlaces();
  }, [router]);

  async function fetchPlaces() {
    const { data } = await supabase.from("places").select("*").order("created_at", { ascending: false });
    setPlaces(data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(p: Place) {
    setEditing(p);
    setForm({ city: p.city, name: p.name, type: p.type ?? "restaurant", description: p.description ?? "", address: p.address ?? "", google_maps_link: p.google_maps_link ?? "" });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from("places").update(form).eq("id", editing.id);
      showToast("Place updated");
    } else {
      await supabase.from("places").insert(form);
      showToast("Place added");
    }
    setShowModal(false);
    setSaving(false);
    fetchPlaces();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this place?")) return;
    await supabase.from("places").delete().eq("id", id);
    showToast("Place deleted");
    fetchPlaces();
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtered = filter === "all" ? places : places.filter((p) => p.type === filter);

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  return (
    <div className="p-8">
      {toast && <div className="fixed top-6 right-6 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">{toast}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Places</h1>
          <p className="text-slate-500 text-sm mt-0.5">{places.length} place{places.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-100">
          + Add Place
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", ...TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors capitalize ${
              filter === t ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-100">
              <th className="px-6 py-3.5 font-semibold text-slate-600">Name</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">City</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Type</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Address</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Added</th>
              <th className="px-6 py-3.5 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No places found.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{p.city}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${typeColors[p.type] ?? typeColors.other}`}>
                    {p.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{p.address || "—"}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                    {p.google_maps_link && (
                      <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Map</a>
                    )}
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
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? "Edit Place" : "Add New Place"}</h3>
            <div className="space-y-4">
              {[
                { label: "Place Name", key: "name", placeholder: "Burj Khalifa" },
                { label: "City", key: "city", placeholder: "Dubai" },
                { label: "Address", key: "address", placeholder: "1 Sheikh Mohammed Blvd, Downtown Dubai" },
                { label: "Google Maps Link", key: "google_maps_link", placeholder: "https://maps.google.com/..." },
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all capitalize"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {saving ? "Saving..." : "Save Place"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
