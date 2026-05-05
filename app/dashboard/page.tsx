"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Hotel = { id: string; name: string; city: string; whatsapp_number: string; language_default: string };
type Tour = { id: string; title: string; price: number; provider: string; affiliate_link: string; description: string };
type Place = { id: string; name: string; type: string; address: string; google_maps_link: string; description: string };

const typeColors: Record<string, string> = {
  restaurant: "bg-orange-100 text-orange-700",
  museum: "bg-violet-100 text-violet-700",
  cafe: "bg-amber-100 text-amber-700",
  attraction: "bg-blue-100 text-blue-700",
  shop: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-600",
};

export default function HotelDashboard() {
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"tours" | "places">("tours");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email ?? "");

      const { data: hotelUser } = await supabase
        .from("hotel_users")
        .select("hotel_id, role")
        .eq("user_id", user.id)
        .single();

      if (!hotelUser) { router.push("/login"); return; }
      if (hotelUser.role === "admin") { router.push("/admin"); return; }

      const { data: hotelData } = await supabase
        .from("hotels")
        .select("*")
        .eq("id", hotelUser.hotel_id)
        .single();

      if (!hotelData) { setLoading(false); return; }
      setHotel(hotelData);

      const [toursRes, placesRes] = await Promise.all([
        supabase.from("tours").select("*").eq("city", hotelData.city).order("created_at", { ascending: false }),
        supabase.from("places").select("*").eq("city", hotelData.city).order("created_at", { ascending: false }),
      ]);

      setTours(toursRes.data ?? []);
      setPlaces(placesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  if (!hotel) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-slate-500">No hotel linked to your account.</p>
      <button onClick={handleLogout} className="text-sm text-blue-600 hover:underline">Sign out</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none">{hotel.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{hotel.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:block">{userEmail}</span>
          <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-500 font-semibold transition-colors">Sign out</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hotel info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{hotel.name}</h1>
              <p className="text-slate-500 text-sm mt-1">{hotel.city}</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{tours.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Tours in {hotel.city}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600">{places.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Places in {hotel.city}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-6 flex-wrap">
            {hotel.whatsapp_number && (
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-500">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm text-slate-600">{hotel.whatsapp_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
              <span className="text-sm text-slate-600 uppercase">{hotel.language_default}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 mb-6 w-fit shadow-sm">
          {(["tours", "places"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab} ({tab === "tours" ? tours.length : places.length})
            </button>
          ))}
        </div>

        {/* Tours tab */}
        {activeTab === "tours" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tours.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                No tours available in {hotel.city} yet.
              </div>
            )}
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1 pr-2">{tour.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${tour.provider === "GYG" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                    {tour.provider}
                  </span>
                </div>
                {tour.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{tour.description}</p>}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-base font-bold text-slate-900">{tour.price ? `$${tour.price}` : "Free"}</span>
                  {tour.affiliate_link && (
                    <a
                      href={tour.affiliate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Book Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Places tab */}
        {activeTab === "places" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {places.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                No places available in {hotel.city} yet.
              </div>
            )}
            {places.map((place) => (
              <div key={place.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1 pr-2">{place.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 capitalize ${typeColors[place.type] ?? typeColors.other}`}>
                    {place.type}
                  </span>
                </div>
                {place.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{place.description}</p>}
                {place.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {place.address}
                  </p>
                )}
                {place.google_maps_link && (
                  <a
                    href={place.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View on Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
