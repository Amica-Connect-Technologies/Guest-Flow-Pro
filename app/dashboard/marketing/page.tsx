"use client";

import { useCallback, useEffect, useState } from "react";
import { marketingApi, type MarketingGuest, type MarketingAnalytics } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

const T = {
  en: {
    title: "Marketing", subtitle: "Email-opted guests ready for campaigns",
    statTotal: "Total Guests", statOptins: "Marketing Opt-ins",
    statOptinRate: "Opt-in Rate", statReviews: "Avg Review Score",
    of: "of", reviews: "reviews",
    monthlyTrend: "Monthly Opt-ins (6 months)",
    topNationalities: "Top Nationalities (opted-in)",
    noData: "No data yet",
    unknown: "Unknown",
    clearFilter: "Clear filter ✕",
    clearDate: "Clear date",
    optedInList: "Opted-in Guest List",
    exportCSV: "Export CSV",
    colName: "Name", colEmail: "Email", colNationality: "Nationality",
    colHotel: "Hotel", colStay: "Stay", colCopy: "Copy",
    noOptins: "No opted-in guests yet",
    noOptinsSub: "Guests who consent to marketing during check-in appear here",
    copyEmail: "Copy email", copied: "Copied!",
    noEmail: "No email",
    csvFirstName: "First Name", csvLastName: "Last Name", csvEmail: "Email",
    csvPhone: "Phone", csvNationality: "Nationality", csvHotel: "Hotel",
    csvCheckin: "Check-in", csvCheckout: "Check-out",
  },
  it: {
    title: "Marketing", subtitle: "Ospiti iscritti pronti per le campagne",
    statTotal: "Totale Ospiti", statOptins: "Iscritti Marketing",
    statOptinRate: "Tasso Iscrizione", statReviews: "Voto Medio Recensioni",
    of: "su", reviews: "recensioni",
    monthlyTrend: "Iscrizioni Mensili (6 mesi)",
    topNationalities: "Principali Nazionalità (iscritti)",
    noData: "Nessun dato ancora",
    unknown: "Sconosciuto",
    clearFilter: "Rimuovi filtro ✕",
    clearDate: "Rimuovi data",
    optedInList: "Lista Ospiti Iscritti",
    exportCSV: "Esporta CSV",
    colName: "Nome", colEmail: "Email", colNationality: "Nazionalità",
    colHotel: "Hotel", colStay: "Soggiorno", colCopy: "Copia",
    noOptins: "Nessun ospite iscritto ancora",
    noOptinsSub: "Gli ospiti che acconsentono al marketing durante il check-in appariranno qui",
    copyEmail: "Copia email", copied: "Copiata!",
    noEmail: "Nessuna email",
    csvFirstName: "Nome", csvLastName: "Cognome", csvEmail: "Email",
    csvPhone: "Telefono", csvNationality: "Nazionalità", csvHotel: "Hotel",
    csvCheckin: "Check-in", csvCheckout: "Check-out",
  },
  es: {
    title: "Marketing", subtitle: "Huéspedes suscritos listos para campañas",
    statTotal: "Total Huéspedes", statOptins: "Suscritos Marketing",
    statOptinRate: "Tasa Suscripción", statReviews: "Valoración Media",
    of: "de", reviews: "reseñas",
    monthlyTrend: "Suscripciones Mensuales (6 meses)",
    topNationalities: "Principales Nacionalidades (suscritos)",
    noData: "Sin datos aún",
    unknown: "Desconocido",
    clearFilter: "Quitar filtro ✕",
    clearDate: "Quitar fecha",
    optedInList: "Lista de Huéspedes Suscritos",
    exportCSV: "Exportar CSV",
    colName: "Nombre", colEmail: "Email", colNationality: "Nacionalidad",
    colHotel: "Hotel", colStay: "Estancia", colCopy: "Copiar",
    noOptins: "Sin huéspedes suscritos aún",
    noOptinsSub: "Los huéspedes que consientan marketing durante el check-in aparecerán aquí",
    copyEmail: "Copiar email", copied: "¡Copiado!",
    noEmail: "Sin email",
    csvFirstName: "Nombre", csvLastName: "Apellido", csvEmail: "Email",
    csvPhone: "Teléfono", csvNationality: "Nacionalidad", csvHotel: "Hotel",
    csvCheckin: "Check-in", csvCheckout: "Check-out",
  },
} as const;

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

function StatTile({ label, value, sub, color = "#06B6D4" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function MarketingPage() {
  const { lang } = useLanguage();
  const t = T[lang as keyof typeof T] ?? T.en;

  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [guests, setGuests] = useState<MarketingGuest[]>([]);
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [sinceFilter, setSinceFilter] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try { setAnalytics(await marketingApi.analytics()); } catch {}
    setLoading(false);
  }, []);

  const loadGuests = useCallback(async () => {
    setGuestLoading(true);
    try {
      const res = await marketingApi.guests({
        nationality: nationalityFilter || undefined,
        since: sinceFilter || undefined,
      });
      setGuests(res.guests);
      setGuestCount(res.count);
    } catch {}
    setGuestLoading(false);
  }, [nationalityFilter, sinceFilter]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  useEffect(() => { loadGuests(); }, [loadGuests]);

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  async function exportCSV() {
    if (!guests.length) return;
    const header = [t.csvFirstName, t.csvLastName, t.csvEmail, t.csvPhone, t.csvNationality, t.csvHotel, t.csvCheckin, t.csvCheckout].join(",");
    const rows = guests.map(g =>
      [g.first_name, g.last_name, g.email, g.phone, g.nationality, g.hotel, g.check_in_date, g.check_out_date]
        .map(v => `"${(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-guests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxCount = analytics?.nationality_breakdown?.[0]?.count ?? 1;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020B12 0%, #083344 55%, #0E7490 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
          </div>
        ) : analytics ? (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatTile label={t.statTotal} value={analytics.total_guests.toLocaleString()} />
              <StatTile label={t.statOptins} value={analytics.marketing_optins.toLocaleString()} color="#10B981" />
              <StatTile label={t.statOptinRate} value={`${analytics.opt_in_rate}%`} color="#F59E0B"
                sub={`${analytics.marketing_optins} ${t.of} ${analytics.total_guests}`} />
              <StatTile label={t.statReviews} color="#06B6D4"
                value={analytics.reviews.avg_rating != null ? `${analytics.reviews.avg_rating} ★` : "—"}
                sub={`${analytics.reviews.total} ${t.reviews}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly trend */}
              <div className="rounded-2xl p-5" style={CARD}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.monthlyTrend}</p>
                {analytics.monthly_trend.length === 0 ? (
                  <p className="text-slate-500 text-sm">{t.noData}</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const maxM = Math.max(...analytics.monthly_trend.map(m => m.count), 1);
                      return analytics.monthly_trend.map(m => (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-20 flex-shrink-0">{m.month}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(m.count / maxM) * 100}%`, background: "linear-gradient(90deg, #06B6D4, #0E7490)" }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white w-6 text-right flex-shrink-0">{m.count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Nationality breakdown */}
              <div className="rounded-2xl p-5" style={CARD}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.topNationalities}</p>
                {analytics.nationality_breakdown.length === 0 ? (
                  <p className="text-slate-500 text-sm">{t.noData}</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.nationality_breakdown.map(n => (
                      <div key={n.nationality} className="flex items-center gap-3">
                        <button
                          onClick={() => setNationalityFilter(prev => prev === n.nationality ? "" : n.nationality)}
                          className={`text-xs w-28 flex-shrink-0 text-left truncate font-semibold transition-colors ${
                            nationalityFilter === n.nationality ? "text-cyan-400" : "text-slate-300 hover:text-white"
                          }`}
                          title={n.nationality}>
                          {n.nationality || t.unknown}
                        </button>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(n.count / maxCount) * 100}%`, background: "#10B981" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white w-6 text-right flex-shrink-0">{n.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {nationalityFilter && (
                  <button
                    onClick={() => setNationalityFilter("")}
                    className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
                    {t.clearFilter}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* Guest list */}
        <div className="rounded-2xl p-5" style={CARD}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.optedInList}
                {guestCount > 0 && <span className="ml-2 text-cyan-400">{guestCount}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {nationalityFilter && (
                <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 rounded-full px-3 py-1 font-semibold flex items-center gap-1">
                  {nationalityFilter}
                  <button onClick={() => setNationalityFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
                </span>
              )}
              <input
                type="date"
                value={sinceFilter}
                onChange={e => setSinceFilter(e.target.value)}
                title="Check-in since"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
              {sinceFilter && (
                <button onClick={() => setSinceFilter("")} className="text-xs text-slate-400 hover:text-white">{t.clearDate}</button>
              )}
              <button
                onClick={exportCSV}
                disabled={!guests.length}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/80 text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                {t.exportCSV}
              </button>
            </div>
          </div>

          {guestLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📬</p>
              <p className="text-white font-bold">{t.noOptins}</p>
              <p className="text-slate-400 text-sm mt-1">{t.noOptinsSub}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-widest border-b border-white/5">
                    <th className="text-left pb-3 font-bold">{t.colName}</th>
                    <th className="text-left pb-3 font-bold hidden sm:table-cell">{t.colEmail}</th>
                    <th className="text-left pb-3 font-bold hidden md:table-cell">{t.colNationality}</th>
                    <th className="text-left pb-3 font-bold hidden lg:table-cell">{t.colHotel}</th>
                    <th className="text-left pb-3 font-bold hidden lg:table-cell">{t.colStay}</th>
                    <th className="text-right pb-3 font-bold">{t.colCopy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {guests.map(g => (
                    <tr key={g.id} className="hover:bg-white/2 transition-colors group">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">{g.first_name} {g.last_name}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{g.email}</p>
                        <p className="text-xs text-slate-500 md:hidden">{g.nationality || "—"}</p>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <p className="text-slate-300 truncate max-w-[200px]">{g.email || "—"}</p>
                        {g.phone && <p className="text-xs text-slate-500">{g.phone}</p>}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <button
                          onClick={() => setNationalityFilter(prev => prev === g.nationality ? "" : g.nationality)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                            nationalityFilter === g.nationality
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                          }`}>
                          {g.nationality || "—"}
                        </button>
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        <p className="text-slate-400 text-xs">{g.hotel}</p>
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        <p className="text-slate-400 text-xs whitespace-nowrap">{fmt(g.check_in_date)} – {fmt(g.check_out_date)}</p>
                      </td>
                      <td className="py-3 text-right">
                        {g.email ? (
                          <button
                            onClick={() => copyEmail(g.email)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                              copiedEmail === g.email
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                            }`}>
                            {copiedEmail === g.email ? t.copied : t.copyEmail}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">{t.noEmail}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
