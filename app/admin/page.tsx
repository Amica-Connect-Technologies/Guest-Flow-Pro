"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminOverview() {
  const router = useRouter();
  const [counts, setCounts] = useState({ hotels: 0, tours: 0, places: 0 });
  const [recentHotels, setRecentHotels] = useState<{ id: string; name: string; city: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email ?? "");

      const [h, t, p, rh] = await Promise.all([
        supabase.from("hotels").select("*", { count: "exact", head: true }),
        supabase.from("tours").select("*", { count: "exact", head: true }),
        supabase.from("places").select("*", { count: "exact", head: true }),
        supabase.from("hotels").select("id, name, city, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      setCounts({ hotels: h.count ?? 0, tours: t.count ?? 0, places: p.count ?? 0 });
      setRecentHotels(rh.data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  const stats = [
    { label: "Total Hotels", value: counts.hotels, color: "bg-blue-600", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    )},
    { label: "Total Tours", value: counts.tours, color: "bg-emerald-600", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    )},
    { label: "Total Places", value: counts.places, color: "bg-violet-600", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    )},
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back, {userEmail}</p>
        </div>
        <Link href="/admin/hotels" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-100">
          + Add Hotel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Hotels */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Recent Hotels</h2>
          <Link href="/admin/hotels" className="text-blue-600 text-sm font-semibold hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentHotels.length === 0 && (
            <p className="px-6 py-8 text-slate-400 text-sm text-center">No hotels added yet.</p>
          )}
          {recentHotels.map((hotel) => (
            <div key={hotel.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                  {hotel.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{hotel.name}</p>
                  <p className="text-slate-400 text-xs">{hotel.city}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(hotel.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { href: "/admin/tours", label: "Manage Tours", desc: "Add or edit tour packages" },
          { href: "/admin/places", label: "Manage Places", desc: "Restaurants, attractions & more" },
          { href: "/admin/hotels", label: "Manage Hotels", desc: "Partner hotel directory" },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
            <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{label}</p>
            <p className="text-slate-400 text-xs mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
