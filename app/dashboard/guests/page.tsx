"use client";

import { useEffect, useState, useCallback } from "react";
import { guestsApi, type CRMGuest, type CRMStats } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const T = {
  en: {
    title: "Guest CRM", subtitle: "All registered guests across your bookings",
    totalGuests: "Total Guests", marketingOptins: "Marketing Opt-ins",
    topCountry: "Top Country", optinRate: "Opt-in Rate",
    topNationalities: "Top Nationalities",
    searchPlaceholder: "Search by name, email, nationality...",
    marketingFilter: "Marketing Opt-in",
    noGuests: "No guests found", noGuestsSub: "Try adjusting your search or filters",
    colGuest: "Guest", colNationality: "Nationality", colCheckin: "Check-in",
    colDocument: "Document", colConsents: "Consents", colActions: "Actions",
    view: "View",
    booking: "Booking", personal: "Personal", document: "Document", consents: "Consents",
    reference: "Reference", hotel: "Hotel", checkIn: "Check-in", checkOut: "Check-out",
    status: "Status", guestNum: "Guest #",
    gender: "Gender", dob: "Date of Birth", nationality: "Nationality", phone: "Phone",
    address: "Address", docType: "Type", docNumber: "Number",
    gdpr: "GDPR Consent", marketing: "Marketing Opt-in",
    yes: "✓ Yes", no: "No", noEmail: "No email",
    registered: "Registered",
    shown: "guest shown", shownPlural: "guests shown",
  },
  it: {
    title: "CRM Ospiti", subtitle: "Tutti gli ospiti registrati nelle tue prenotazioni",
    totalGuests: "Totale Ospiti", marketingOptins: "Iscritti Marketing",
    topCountry: "Paese Principale", optinRate: "Tasso Iscrizione",
    topNationalities: "Principali Nazionalità",
    searchPlaceholder: "Cerca per nome, email, nazionalità...",
    marketingFilter: "Iscritti Marketing",
    noGuests: "Nessun ospite trovato", noGuestsSub: "Prova a modificare la ricerca o i filtri",
    colGuest: "Ospite", colNationality: "Nazionalità", colCheckin: "Check-in",
    colDocument: "Documento", colConsents: "Consensi", colActions: "Azioni",
    view: "Vedi",
    booking: "Prenotazione", personal: "Dati Personali", document: "Documento", consents: "Consensi",
    reference: "Riferimento", hotel: "Hotel", checkIn: "Check-in", checkOut: "Check-out",
    status: "Stato", guestNum: "Ospite N°",
    gender: "Genere", dob: "Data di Nascita", nationality: "Nazionalità", phone: "Telefono",
    address: "Indirizzo", docType: "Tipo", docNumber: "Numero",
    gdpr: "Consenso GDPR", marketing: "Iscrizione Marketing",
    yes: "✓ Sì", no: "No", noEmail: "Nessuna email",
    registered: "Registrato",
    shown: "ospite visualizzato", shownPlural: "ospiti visualizzati",
  },
  es: {
    title: "CRM Huéspedes", subtitle: "Todos los huéspedes registrados en tus reservas",
    totalGuests: "Total Huéspedes", marketingOptins: "Suscripciones Marketing",
    topCountry: "País Principal", optinRate: "Tasa Suscripción",
    topNationalities: "Principales Nacionalidades",
    searchPlaceholder: "Buscar por nombre, email, nacionalidad...",
    marketingFilter: "Suscritos Marketing",
    noGuests: "No se encontraron huéspedes", noGuestsSub: "Intenta ajustar tu búsqueda o filtros",
    colGuest: "Huésped", colNationality: "Nacionalidad", colCheckin: "Check-in",
    colDocument: "Documento", colConsents: "Consentimientos", colActions: "Acciones",
    view: "Ver",
    booking: "Reserva", personal: "Personal", document: "Documento", consents: "Consentimientos",
    reference: "Referencia", hotel: "Hotel", checkIn: "Check-in", checkOut: "Check-out",
    status: "Estado", guestNum: "Huésped N°",
    gender: "Género", dob: "Fecha Nacimiento", nationality: "Nacionalidad", phone: "Teléfono",
    address: "Dirección", docType: "Tipo", docNumber: "Número",
    gdpr: "Consentimiento GDPR", marketing: "Suscripción Marketing",
    yes: "✓ Sí", no: "No", noEmail: "Sin email",
    registered: "Registrado",
    shown: "huésped mostrado", shownPlural: "huéspedes mostrados",
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";
}
function initials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}
const DOC_ICONS: Record<string, string> = {
  passport: "🛂", id_card: "🪪", driving_license: "🚗", residence_permit: "🏠",
};

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: color + "22" }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Guest detail drawer ────────────────────────────────────────────────────────
function GuestDrawer({ guest, onClose, t }: { guest: CRMGuest; onClose: () => void; t: (typeof T)[keyof typeof T] }) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-700 overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0E7490,#083344)" }}>
            {initials(guest.first_name, guest.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-base">{guest.first_name} {guest.last_name}</p>
            <p className="text-xs text-slate-400 truncate">{guest.guest_email || t.noEmail}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Booking info */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.booking}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                [t.reference, guest.booking_reference || "—"],
                [t.hotel, guest.hotel_name],
                [t.checkIn, fmt(guest.check_in_date)],
                [t.checkOut, fmt(guest.check_out_date)],
                [t.status, cap(guest.booking_status)],
                [t.guestNum, String(guest.guest_number)],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{l}</p>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Personal */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.personal}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                [t.gender, cap(guest.gender)],
                [t.dob, fmt(guest.date_of_birth)],
                [t.nationality, guest.nationality || "—"],
                [t.phone, guest.guest_phone || "—"],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{l}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{v}</p>
                </div>
              ))}
              {guest.residence_address && (
                <div className="col-span-2 bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{t.address}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{guest.residence_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Document */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.document}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                [t.docType, `${DOC_ICONS[guest.document_type] ?? "📄"} ${cap(guest.document_type)}`],
                [t.docNumber, guest.document_number || "—"],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{l}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {guest.document_image_url && (
              <img src={guest.document_image_url} alt="Document" className="mt-3 rounded-xl w-full max-h-48 object-contain border border-slate-700" />
            )}
          </div>

          {/* Consents */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.consents}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-300 font-semibold">{t.gdpr}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${guest.gdpr_consent ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                  {guest.gdpr_consent ? t.yes : t.no}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-300 font-semibold">{t.marketing}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${guest.marketing_optin ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700 text-slate-400"}`}>
                  {guest.marketing_optin ? t.yes : t.no}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">{t.registered} {fmt(guest.completed_at)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GuestsPage() {
  const { lang } = useLanguage();
  const t = T[lang as keyof typeof T] ?? T.en;

  const [guests, setGuests] = useState<CRMGuest[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMarketing, setFilterMarketing] = useState(false);
  const [filterNationality, setFilterNationality] = useState("");
  const [selected, setSelected] = useState<CRMGuest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterMarketing) params.marketing_optin = "true";
      if (filterNationality) params.nationality = filterNationality;
      const res = await guestsApi.list(params);
      setGuests(res.guests);
      setStats(res.stats);
    } catch {}
    setLoading(false);
  }, [search, filterMarketing, filterNationality]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatTile label={t.totalGuests} value={stats.total} icon="👥" color="#0E7490" />
            <StatTile label={t.marketingOptins} value={stats.marketing_optins} icon="📧" color="#10B981" />
            <StatTile label={t.topCountry} value={stats.top_countries[0]?.nationality || "—"} icon="🌍" color="#F59E0B" />
            <StatTile
              label={t.optinRate}
              value={stats.total > 0 ? `${Math.round((stats.marketing_optins / stats.total) * 100)}%` : "—"}
              icon="📊" color="#8B5CF6"
            />
          </div>
        )}

        {/* Top countries bar */}
        {stats && stats.top_countries.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.topNationalities}</p>
            <div className="flex flex-wrap gap-2">
              {stats.top_countries.map(c => (
                <button key={c.nationality}
                  onClick={() => setFilterNationality(filterNationality === c.nationality ? "" : c.nationality)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    filterNationality === c.nationality
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}>
                  {c.nationality} <span className="opacity-70">({c.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterMarketing(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              filterMarketing
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
            }`}>
            📧 {t.marketingFilter}
            {filterMarketing && <span className="ml-1 opacity-70">✓</span>}
          </button>

          {filterNationality && (
            <button onClick={() => setFilterNationality("")}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-amber-500 text-white">
              🌍 {filterNationality} ✕
            </button>
          )}
        </div>

        {/* Guest table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-white font-bold text-lg">{t.noGuests}</p>
            <p className="text-slate-400 text-sm mt-1">{t.noGuestsSub}</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="col-span-3">{t.colGuest}</div>
              <div className="col-span-2">{t.colNationality}</div>
              <div className="col-span-2">{t.colCheckin}</div>
              <div className="col-span-2">{t.colDocument}</div>
              <div className="col-span-2">{t.colConsents}</div>
              <div className="col-span-1">{t.colActions}</div>
            </div>

            {guests.map((g, i) => (
              <div key={g.id}
                className="grid grid-cols-12 gap-3 px-5 py-4 items-center transition-colors hover:bg-white/5 cursor-pointer"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
                onClick={() => setSelected(g)}>

                {/* Guest name + email */}
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#0E7490,#083344)" }}>
                    {initials(g.first_name, g.last_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{g.first_name} {g.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{g.guest_email || g.guest_phone || "—"}</p>
                  </div>
                </div>

                {/* Nationality */}
                <div className="col-span-2">
                  <span className="text-sm text-slate-300 font-semibold">{g.nationality || "—"}</span>
                </div>

                {/* Check-in */}
                <div className="col-span-2">
                  <p className="text-sm text-slate-300 font-semibold">{fmt(g.check_in_date)}</p>
                  <p className="text-xs text-slate-500">{g.hotel_name}</p>
                </div>

                {/* Document */}
                <div className="col-span-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-700 text-slate-300">
                    {DOC_ICONS[g.document_type] ?? "📄"} {cap(g.document_type)}
                  </span>
                </div>

                {/* Consents */}
                <div className="col-span-2 flex gap-1.5 flex-wrap">
                  {g.gdpr_consent && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">GDPR</span>
                  )}
                  {g.marketing_optin && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">Marketing</span>
                  )}
                  {!g.gdpr_consent && !g.marketing_optin && (
                    <span className="text-[10px] text-slate-500">—</span>
                  )}
                </div>

                {/* View button */}
                <div className="col-span-1">
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(g); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors">
                    {t.view}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-6">
          {guests.length} {guests.length !== 1 ? t.shownPlural : t.shown}
        </p>
      </div>

      {/* Detail drawer */}
      {selected && <GuestDrawer guest={selected} onClose={() => setSelected(null)} t={t} />}
    </div>
  );
}
