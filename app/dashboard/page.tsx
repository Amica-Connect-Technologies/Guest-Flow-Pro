"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  auth, hotelsApi, servicesApi, bookingsApi,
  type Hotel, type HotelService, type ServiceBooking,
} from "@/lib/api";
import Image from "next/image";
import QRCode from "react-qr-code";

// ── helpers ───────────────────────────────────────────────────────────────────
const CAT_LABEL: Record<string, string> = {
  food: "Food & Drinks", room: "Room Service", tour: "Tour", activity: "Activity", other: "Other",
};
const CAT_ICON: Record<string, string> = {
  food: "🍽️", room: "🛏️", tour: "🗺️", activity: "🎯", other: "✨",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};
const PAY_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  paid:    "bg-emerald-100 text-emerald-700",
};

// ── Service form ──────────────────────────────────────────────────────────────
type SvcForm = {
  name: string; description: string; category: string;
  price: string; is_available: boolean; imageFile: File | null; previewUrl: string;
};
const blankForm = (): SvcForm => ({
  name: "", description: "", category: "food", price: "", is_available: true, imageFile: null, previewUrl: "",
});

export default function HotelDashboard() {
  const router = useRouter();
  const [hotel, setHotel]     = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // ── active section
  const [section, setSection] = useState<"qr" | "services" | "bookings">("qr");

  // ── services
  const [services, setServices]   = useState<HotelService[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcForm, setSvcForm]     = useState<SvcForm>(blankForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcError, setSvcError]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  // ── bookings
  const [bookings, setBookings]     = useState<ServiceBooking[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookFilter, setBookFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [toast, setToast] = useState({ msg: "", ok: true });

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      let userInfo;
      try { userInfo = await auth.me(); } catch { router.push("/login"); return; }
      setUserEmail(userInfo.email);
      if (userInfo.role === "admin") { router.push("/admin"); return; }
      if (!userInfo.hotel_id) { setLoading(false); return; }

      try {
        const h = await hotelsApi.get(userInfo.hotel_id);
        setHotel(h);
      } catch { /* fall through */ }
      setLoading(false);
    }
    load();
  }, [router]);

  // ── load services / bookings when section changes
  useEffect(() => {
    if (!hotel) return;
    if (section === "services") fetchServices();
    if (section === "bookings") fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, hotel]);

  async function fetchServices() {
    setSvcLoading(true);
    try { setServices(await servicesApi.myList()); } catch { /* stay */ }
    setSvcLoading(false);
  }

  async function fetchBookings() {
    setBookLoading(true);
    try { setBookings(await bookingsApi.list()); } catch { /* stay */ }
    setBookLoading(false);
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  // ── service CRUD ──────────────────────────────────────────────────────────
  function openAddService() {
    setSvcForm(blankForm());
    setEditingId(null);
    setSvcError("");
    setShowSvcForm(true);
  }
  function openEditService(svc: HotelService) {
    setSvcForm({
      name: svc.name, description: svc.description, category: svc.category,
      price: String(svc.price), is_available: svc.is_available,
      imageFile: null, previewUrl: svc.image_url ?? "",
    });
    setEditingId(svc.id);
    setSvcError("");
    setShowSvcForm(true);
  }

  async function saveService() {
    if (!svcForm.name.trim() || !svcForm.price) { setSvcError("Name and price are required."); return; }
    setSvcSaving(true); setSvcError("");
    const fd = new FormData();
    fd.append("name",         svcForm.name.trim());
    fd.append("description",  svcForm.description.trim());
    fd.append("category",     svcForm.category);
    fd.append("price",        svcForm.price);
    fd.append("is_available", svcForm.is_available ? "true" : "false");
    if (svcForm.imageFile) fd.append("image", svcForm.imageFile);
    try {
      if (editingId) {
        await servicesApi.update(editingId, fd);
        showToast("Service updated.");
      } else {
        await servicesApi.create(fd);
        showToast("Service added.");
      }
      setShowSvcForm(false);
      fetchServices();
    } catch (e) {
      setSvcError(e instanceof Error ? e.message : "Save failed");
    }
    setSvcSaving(false);
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    setDeletingId(id);
    try {
      await servicesApi.delete(id);
      setServices(s => s.filter(x => x.id !== id));
      showToast("Service deleted.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", false);
    }
    setDeletingId(null);
  }

  // ── booking status update ─────────────────────────────────────────────────
  async function updateBooking(id: string, data: { status?: string; payment_status?: string }) {
    setUpdatingId(id);
    try {
      const updated = await bookingsApi.updateStatus(id, data);
      setBookings(b => b.map(x => x.id === id ? updated : x));
      showToast("Updated.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", false);
    }
    setUpdatingId(null);
  }

  // ── guards ────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400 text-sm">Loading…</div>;
  if (!hotel) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-slate-500">No hotel linked to your account.</p>
      <button onClick={() => { auth.logout(); router.push("/login"); }} className="text-sm text-blue-600 hover:underline">Sign out</button>
    </div>
  );

  const guestUrl = typeof window !== "undefined" ? `${window.location.origin}/h/${hotel.id}` : `/h/${hotel.id}`;
  const filteredBookings = bookFilter === "all" ? bookings : bookings.filter(b => b.status === bookFilter);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 text-white text-sm px-5 py-3 rounded-2xl shadow-xl z-[300] whitespace-nowrap transition-all ${toast.ok ? "bg-slate-900" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {hotel.logo_url ? (
            <Image unoptimized src={hotel.logo_url} alt={hotel.name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover border border-slate-100" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {hotel.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none">{hotel.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{hotel.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">{userEmail}</span>
          <button onClick={() => { auth.logout(); router.push("/login"); }}
            className="text-xs text-slate-500 hover:text-red-500 font-semibold transition-colors">Sign out</button>
        </div>
      </header>

      {/* ── Section Nav ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="flex gap-1 py-2 max-w-xl">
          {([
            { key: "qr",       label: "QR Code"  },
            { key: "services", label: "Services" },
            { key: "bookings", label: "Bookings" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${section === key ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {label}
              {key === "bookings" && bookings.filter(b => b.status === "pending").length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {bookings.filter(b => b.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

        {/* ════ QR CODE SECTION ══════════════════════════════════════════════ */}
        {section === "qr" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 text-sm mb-1">Guest QR Code</h2>
            <p className="text-xs text-slate-400 mb-5">Guests scan this to access your services, tours, and attractions.</p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-shrink-0">
                <QRCode value={guestUrl} size={140} />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs text-slate-500 mb-2">Concierge link</p>
                <a href={guestUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 break-all hover:underline">{guestUrl}</a>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button onClick={() => navigator.clipboard.writeText(guestUrl)}
                    className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
                    Copy link
                  </button>
                  <a href={guestUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors text-center">
                    Preview as guest
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ SERVICES SECTION ════════════════════════════════════════════ */}
        {section === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-sm">Your Services <span className="text-slate-400 font-normal">({services.length})</span></p>
              <button onClick={openAddService}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Service
              </button>
            </div>

            {svcLoading ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
                <p className="text-4xl mb-3">🛎️</p>
                <p className="font-bold text-slate-700 text-sm">No services yet</p>
                <p className="text-slate-400 text-xs mt-1">Add food, room service, tours, and more.</p>
                <button onClick={openAddService}
                  className="mt-4 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                  Add First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(svc => (
                  <div key={svc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${svc.is_available ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                    <div className="flex items-start gap-3 p-4">
                      {svc.image_url ? (
                        <Image unoptimized src={svc.image_url} alt={svc.name} width={56} height={56}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-2xl">
                          {CAT_ICON[svc.category] ?? "✨"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{svc.name}</p>
                          {!svc.is_available && (
                            <span className="text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Hidden</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">{CAT_LABEL[svc.category] ?? svc.category}</p>
                        <p className="font-bold text-emerald-600 text-sm mt-1">£{Number(svc.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex border-t border-slate-100">
                      <button onClick={() => openEditService(svc)}
                        className="flex-1 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">Edit</button>
                      <button onClick={() => deleteService(svc.id)} disabled={deletingId === svc.id}
                        className="flex-1 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100 disabled:opacity-50">
                        {deletingId === svc.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ BOOKINGS SECTION ════════════════════════════════════════════ */}
        {section === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-sm">Bookings <span className="text-slate-400 font-normal">({bookings.length})</span></p>
              <button onClick={fetchBookings} className="text-xs text-blue-600 font-semibold hover:underline">Refresh</button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { k: "all", label: "All" },
                { k: "pending", label: "Pending" },
                { k: "confirmed", label: "Confirmed" },
                { k: "completed", label: "Completed" },
                { k: "cancelled", label: "Cancelled" },
              ].map(({ k, label }) => (
                <button key={k} onClick={() => setBookFilter(k)}
                  className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${bookFilter === k ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>
                  {label}
                </button>
              ))}
            </div>

            {bookLoading ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-bold text-slate-700 text-sm">No bookings yet</p>
                <p className="text-slate-400 text-xs mt-1">Guest bookings will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{b.service_name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                              {b.status}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${PAY_STATUS_COLORS[b.payment_status] ?? ""}`}>
                              {b.payment_status === "paid" ? "Paid" : b.payment_method === "cod" ? "COD" : "Unpaid"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{b.guest_name}
                            {b.guest_room && <span className="text-slate-400"> · Room {b.guest_room}</span>}
                            {b.guest_phone && <span className="text-slate-400"> · {b.guest_phone}</span>}
                          </p>
                          {b.notes && <p className="text-xs text-slate-400 mt-1 italic">"{b.notes}"</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 text-sm">£{Number(b.total_price).toFixed(2)}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">×{b.quantity}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-2">
                        {new Date(b.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                        {b.status === "pending" && (
                          <button onClick={() => updateBooking(b.id, { status: "confirmed" })}
                            disabled={updatingId === b.id}
                            className="flex-1 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors">
                            Confirm
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => updateBooking(b.id, { status: "completed" })}
                            disabled={updatingId === b.id}
                            className="flex-1 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                            Mark Done
                          </button>
                        )}
                        {b.payment_status === "pending" && b.payment_method !== "stripe" && (
                          <button onClick={() => updateBooking(b.id, { payment_status: "paid" })}
                            disabled={updatingId === b.id}
                            className="flex-1 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => updateBooking(b.id, { status: "cancelled" })}
                          disabled={updatingId === b.id}
                          className="flex-1 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ SERVICE FORM SHEET ══════════════════════════════════════════════ */}
      {showSvcForm && (
        <>
          <div onClick={() => !svcSaving && setShowSvcForm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 210, background: "white",
            borderRadius: "24px 24px 0 0", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            maxHeight: "92vh", overflowY: "auto" }}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pb-2">
              <h3 className="font-bold text-slate-900 text-base mb-4">{editingId ? "Edit Service" : "Add Service"}</h3>

              <div className="space-y-3">
                {/* Image upload */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">Photo</label>
                  <div className="flex items-center gap-3">
                    <div onClick={() => imgRef.current?.click()}
                      className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 transition-colors flex-shrink-0">
                      {svcForm.previewUrl ? (
                        <Image unoptimized src={svcForm.previewUrl} alt="" width={64} height={64} className="w-16 h-16 object-cover" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21zM12.75 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      )}
                    </div>
                    <button type="button" onClick={() => imgRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:underline">
                      {svcForm.previewUrl ? "Change photo" : "Upload photo"}
                    </button>
                    <input ref={imgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setSvcForm(s => ({ ...s, imageFile: f, previewUrl: URL.createObjectURL(f) }));
                      }} />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Name <span className="text-red-400">*</span></label>
                  <input value={svcForm.name} onChange={e => setSvcForm(s => ({ ...s, name: e.target.value }))}
                    placeholder="e.g. Club Sandwich, Airport Transfer…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
                  <textarea value={svcForm.description} onChange={e => setSvcForm(s => ({ ...s, description: e.target.value }))}
                    rows={2} placeholder="Brief description…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>

                {/* Category + Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                    <select value={svcForm.category} onChange={e => setSvcForm(s => ({ ...s, category: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all">
                      {Object.entries(CAT_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Price (£) <span className="text-red-400">*</span></label>
                    <input type="number" min="0" step="0.01" value={svcForm.price}
                      onChange={e => setSvcForm(s => ({ ...s, price: e.target.value }))}
                      placeholder="9.99"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* Payment hint for food */}
                {svcForm.category === "food" && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-sm">💵</span>
                    <p className="text-xs text-orange-700 font-medium">Food items use <strong>Cash on Delivery</strong> automatically.</p>
                  </div>
                )}

                {/* Available toggle */}
                <button type="button" onClick={() => setSvcForm(s => ({ ...s, is_available: !s.is_available }))}
                  className="flex items-center gap-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${svcForm.is_available ? "bg-blue-600" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow ${svcForm.is_available ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Available to guests</span>
                </button>
              </div>

              {svcError && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-600">{svcError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSvcForm(false)} disabled={svcSaving}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm">
                  Cancel
                </button>
                <button onClick={saveService} disabled={svcSaving}
                  className="flex-1 bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm">
                  {svcSaving ? "Saving…" : editingId ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
