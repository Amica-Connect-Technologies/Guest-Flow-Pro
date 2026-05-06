import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Places | Guest Flow Pro",
  description: "Discover the best restaurants, museums, cafes, attractions and hidden gems — curated by our concierge team.",
};

type Place = { id: string; name: string; city: string; type: string; description: string; address: string; google_maps_link: string };

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  restaurant: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  museum:     { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  cafe:       { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  attraction: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  shop:       { bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500" },
  other:      { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400"  },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  restaurant: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v3.41a3.001 3.001 0 01-1.5 2.598V18.75h15v-2.134a3.001 3.001 0 01-1.5-2.598v-3.41" /></svg>,
  museum:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>,
  cafe:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 1.265l.39 3.905A2.25 2.25 0 0118.393 22.5H5.607a2.25 2.25 0 01-2.247-2.326l.39-3.905A2.25 2.25 0 015.2 15M19.8 15H4.2" /></svg>,
  attraction: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  shop:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  other:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
};

const TYPES = ["restaurant", "museum", "cafe", "attraction", "shop", "other"];

export default async function PlacesPage() {
  const { data } = await supabase
    .from("places")
    .select("id, name, city, type, description, address, google_maps_link")
    .order("created_at", { ascending: false });

  const places: Place[] = data ?? [];
  const cities = [...new Set(places.map((p) => p.city).filter(Boolean))];

  const grouped: Record<string, Place[]> = {};
  for (const t of TYPES) {
    const list = places.filter((p) => p.type === t);
    if (list.length > 0) grouped[t] = list;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Discover the City
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-5">
            Places to Visit
          </h1>
          <div className="w-16 h-1 bg-violet-400 mx-auto mb-5 rounded-full" />
          <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Restaurants, museums, cafes, attractions and hidden gems — personally recommended by our concierge team.
          </p>
        </div>
      </section>

      {/* Type categories */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {TYPES.map((type) => {
              const colors = TYPE_COLORS[type] ?? TYPE_COLORS.other;
              const count = places.filter((p) => p.type === type).length;
              return (
                <div key={type} className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all cursor-pointer group ${count > 0 ? "border-slate-200 hover:border-blue-200 hover:shadow-sm" : "border-slate-100 opacity-50"}`}>
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center mb-2 ${colors.text}`}>
                    {TYPE_ICONS[type]}
                  </div>
                  <p className="text-slate-800 font-semibold text-xs capitalize">{type}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{count} place{count !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
          {cities.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-6">
              <span className="text-xs font-semibold text-slate-500 self-center mr-1">Cities:</span>
              {cities.map((city) => (
                <span key={city} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">{city}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Places grouped by type */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">

          {places.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg font-medium mb-2">Places coming soon</p>
              <p className="text-slate-400 text-sm mb-6">We are curating the best spots. Contact us for recommendations.</p>
              <Link href="/contact" className="btn-primary">Contact Our Concierge</Link>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(grouped).map(([type, list]) => {
                const colors = TYPE_COLORS[type] ?? TYPE_COLORS.other;
                return (
                  <div key={type}>
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                        {TYPE_ICONS[type]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 capitalize">{type === "other" ? "Other Places" : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}</h2>
                        <p className="text-xs text-slate-400">{list.length} place{list.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {list.map((place) => (
                        <div key={place.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors leading-snug flex-1 pr-2">{place.name}</h3>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize flex-shrink-0 ${colors.bg} ${colors.text}`}>
                              {place.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-500 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{place.city}</span>
                          </div>

                          {place.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">{place.description}</p>}

                          {place.address && (
                            <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                              </svg>
                              {place.address}
                            </p>
                          )}

                          {place.google_maps_link && (
                            <a href={place.google_maps_link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              View on Google Maps
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-hero-gradient py-20 text-center text-white px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Need a Personal Recommendation?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Our concierge team knows every city inside out. Tell us what you are looking for and we will find the perfect spot.
          </p>
          <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">Ask Our Concierge</Link>
        </div>
      </section>
    </>
  );
}
