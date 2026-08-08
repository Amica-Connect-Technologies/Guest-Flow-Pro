"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { outreachApi, type HotelOutreach, type OutreachStatus } from "@/lib/api";

const STATUS_META: Record<OutreachStatus, { label: string; color: string; bg: string }> = {
  new:         { label: "New Lead",    color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  contacted:   { label: "Contacted",   color: "#3B82F6", bg: "rgba(59,130,246,0.10)"  },
  interested:  { label: "Interested",  color: "#10B981", bg: "rgba(16,185,129,0.10)"  },
  negotiating: { label: "Negotiating", color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  converted:   { label: "Converted",   color: "#059669", bg: "rgba(5,150,105,0.12)"   },
  lost:        { label: "Lost",        color: "#EF4444", bg: "rgba(239,68,68,0.10)"   },
};

const STATUSES = Object.keys(STATUS_META) as OutreachStatus[];

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(d?: string | null) {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function downloadSampleCSV() {
  const rows = [
    "Business Title,Category Name,Email,City,Address,Phone,Location,Total Review Score,PlaceID,Categories,Places Tags,Language,Rank,Image URL,Description,Website",
    'Grand Palace Hotel,Hotel,contact@grandpalace.com,Rome,"Via Roma 12, Rome",+390612345670,"41.9028,12.4964",4.5,ChIJexamplePlaceId1,Hotel,"Hotel, Lodging",en,1,https://example.com/image1.jpg,"A luxury hotel in the heart of Rome.",https://grandpalace.com',
    'Hotel Bella Vista,Hotel,info@bellavista.it,Florence,"Via Vista 5, Florence",+390559876543,"43.7696,11.2558",4.2,ChIJexamplePlaceId2,Hotel,"Hotel, Lodging",it,2,https://example.com/image2.jpg,"Charming boutique hotel near the Duomo.",https://bellavista.it',
    'Amalfi Dreams,Hotel,reservations@amalfidreams.com,Amalfi,"Via Amalfi 8, Amalfi",,"40.6340,14.6027",4.8,ChIJexamplePlaceId3,Hotel,"Hotel, Resort",it,3,,"Seaside hotel with panoramic coastal views.",',
  ].join("\r\n");
  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "outreach_sample.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type FormState = {
  hotel_name: string; contact_name: string; email: string;
  phone: string; city: string; website: string; status: OutreachStatus; notes: string;
};
const blank = (): FormState => ({
  hotel_name: "", contact_name: "", email: "", phone: "",
  city: "", website: "", status: "new", notes: "",
});

export default function OutreachPage() {
  const [leads, setLeads] = useState<HotelOutreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(blank());
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<HotelOutreach | null>(null);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [inviting, setInviting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [bulkInviting, setBulkInviting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await outreachApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
      }));
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "Failed to load leads", false);
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(blank()); setShowForm(true); }

  function openEdit(lead: HotelOutreach) {
    setEditing(lead);
    setForm({
      hotel_name: lead.hotel_name, contact_name: lead.contact_name,
      email: lead.email, phone: lead.phone, city: lead.city,
      website: lead.website, status: lead.status, notes: lead.notes,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.hotel_name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await outreachApi.update(editing.id, form);
        setLeads(prev => prev.map(l => l.id === editing.id ? updated : l));
        showToast("Lead updated");
      } else {
        const created = await outreachApi.create(form);
        setLeads(prev => [created, ...prev]);
        showToast("Lead created");
      }
      setShowForm(false);
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "Failed to save", false);
    }
    setSaving(false);
  }

  async function sendInvite(lead: HotelOutreach) {
    if (!lead.email) { showToast("No email on this lead", false); return; }
    if (!confirm(`Send invitation email to ${lead.email}?`)) return;
    setInviting(lead.id);
    try {
      const res = await outreachApi.sendInvite(lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id
        ? { ...l, invite_sent_at: res.invite_sent_at, status: l.status === "new" ? "contacted" : l.status }
        : l));
      showToast("Invitation sent!");
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "Failed to send invite", false);
    }
    setInviting(null);
  }

  async function del(id: string) {
    if (!confirm("Delete this lead?")) return;
    try {
      await outreachApi.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      showToast("Lead deleted");
    } catch {
      showToast("Failed to delete", false);
    }
  }

  async function updateStatus(lead: HotelOutreach, newStatus: OutreachStatus) {
    try {
      const updated = await outreachApi.update(lead.id, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
    } catch {
      showToast("Failed to update status", false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await outreachApi.importCSV(file);
      showToast(`Imported ${res.created} leads, ${res.skipped} skipped`);
      load();
    } catch (err: unknown) {
      showToast((err instanceof Error ? err.message : null) ?? "Import failed", false);
    }
    setImporting(false);
    e.target.value = "";
  }

  async function handleBulkInvite() {
    const ids = selected.size > 0 ? [...selected] : undefined;
    const count = ids ? ids.length : leads.filter(l => l.email && !l.invite_sent_at).length;
    if (!count) { showToast("No uninvited leads with email", false); return; }
    if (!confirm(`Send trial invitation to ${count} hotel${count !== 1 ? "s" : ""}?`)) return;
    setBulkInviting(true);
    try {
      const res = await outreachApi.bulkInvite(ids);
      showToast(`Sent ${res.sent} invitation${res.sent !== 1 ? "s" : ""}${res.failed ? `, ${res.failed} failed` : ""}`);
      load();
      setSelected(new Set());
    } catch (err: unknown) {
      showToast((err instanceof Error ? err.message : null) ?? "Bulk invite failed", false);
    }
    setBulkInviting(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {toast.msg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 whitespace-nowrap ${toast.ok ? "bg-slate-700" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Hotel Outreach</h1>
            <p className="text-slate-500 text-sm mt-1">Track potential hotel partners · send 14-day trial invitations</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sample CSV download */}
            <button
              onClick={downloadSampleCSV}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Sample CSV
            </button>
            {/* CSV Import */}
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition-colors flex items-center gap-1.5">
              {importing ? "Importing…" : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Import CSV
                </>
              )}
            </button>
            {/* Bulk invite */}
            <button
              onClick={handleBulkInvite}
              disabled={bulkInviting}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors flex items-center gap-1.5">
              {bulkInviting ? "Sending…" : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {selected.size > 0 ? `Send to ${selected.size} selected` : "Send All Invites"}
                </>
              )}
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              + Add Lead
            </button>
          </div>
        </div>

        {/* CSV format hint */}
        <div className="mb-5 text-[11px] text-slate-500 bg-white rounded-xl px-4 py-2.5 border border-slate-200 flex items-center flex-wrap gap-x-1">
          <span>CSV columns (any order, extra columns are ignored):</span>
          <span className="font-mono text-slate-700 mx-1">Business Title / hotel_name, Email, City, Phone, contact_name, Website</span>
          <span>— duplicates by email are skipped automatically.</span>
          <button onClick={downloadSampleCSV} className="ml-2 text-blue-500 hover:text-blue-700 underline underline-offset-2 font-medium">
            Download sample
          </button>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {STATUSES.map(s => {
            const m = STATUS_META[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(prev => prev === s ? "" : s)}
                className="rounded-xl p-3 text-left transition-all border"
                style={{
                  background: active ? m.bg : "#ffffff",
                  borderColor: active ? m.color + "60" : "#E2E8F0",
                  boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                <p className="text-xl font-black" style={{ color: m.color }}>{counts[s] ?? 0}</p>
                <p className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5">{m.label}</p>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by hotel name or city…"
            className="w-full sm:w-80 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          />
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-800 font-bold text-lg">No leads yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first potential hotel partner above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map(lead => {
              const m = STATUS_META[lead.status];
              const isSel = selected.has(lead.id);
              return (
                <div key={lead.id}
                  className="rounded-2xl p-4 flex items-start gap-3 group transition-all"
                  style={{
                    background: isSel ? "rgba(59,130,246,0.05)" : "#ffffff",
                    border: `1px solid ${isSel ? "rgba(59,130,246,0.30)" : "#E2E8F0"}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}>

                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(lead.id)}
                    className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${isSel ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-slate-400"}`}>
                    {isSel && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </button>

                  {/* Status badge + quick change */}
                  <div className="flex-shrink-0 pt-0.5">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead, e.target.value as OutreachStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      style={{ background: m.bg, color: m.color }}>
                      {STATUSES.map(s => (
                        <option key={s} value={s} style={{ background: "#ffffff", color: "#1E293B" }}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-black text-slate-900">{lead.hotel_name}</p>
                      {lead.city && <span className="text-xs text-slate-400">{lead.city}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                      {lead.contact_name && <span>{lead.contact_name}</span>}
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 truncate max-w-[160px]">
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lead.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[11px]">
                      <span className="text-slate-400">Added {fmt(lead.created_at)}</span>
                      {lead.invite_sent_at && (
                        <span className="text-cyan-600">✉ Sent {fmt(lead.invite_sent_at)}</span>
                      )}
                      {lead.email_opened_at ? (
                        <span className="text-emerald-600 font-semibold">
                          👁 Opened {timeAgo(lead.email_opened_at)}
                          {lead.email_open_count > 1 && ` (${lead.email_open_count}×)`}
                        </span>
                      ) : lead.invite_sent_at ? (
                        <span className="text-slate-400">Not opened yet</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lead.email && (
                      <button
                        onClick={() => sendInvite(lead)}
                        disabled={inviting === lead.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors whitespace-nowrap">
                        {inviting === lead.id ? "Sending…" : lead.invite_sent_at ? "Resend" : "Send invite"}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(lead)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => del(lead.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit sheet */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
            <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl p-6 md:w-full md:max-w-lg mx-auto md:border md:border-slate-200">
              <h2 className="text-lg font-black text-slate-900 mb-5">{editing ? "Edit Lead" : "Add New Lead"}</h2>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {(["hotel_name", "contact_name", "email", "phone", "city", "website"] as const).map(field => (
                  <input
                    key={field}
                    value={form[field]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                ))}
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as OutreachStatus }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes (optional)…"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.hotel_name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-colors">
                  {saving ? "Saving…" : editing ? "Update" : "Add Lead"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
