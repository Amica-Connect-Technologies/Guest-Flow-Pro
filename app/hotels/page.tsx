import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Hotels | Guest Flow Pro",
  description:
    "Discover handpicked luxury and boutique hotels across the UK, curated by our Italian concierge team for an unforgettable stay.",
};

const AVATAR_COLORS = [
  "bg-blue-700", "bg-slate-700", "bg-emerald-700",
  "bg-amber-700", "bg-purple-700", "bg-rose-700",
];

const categories = [
  { label: "Luxury 5-Star", count: "12 Hotels" },
  { label: "Boutique & Intimate", count: "18 Hotels" },
  { label: "Country Retreats", count: "9 Hotels" },
  { label: "Historic Properties", count: "14 Hotels" },
  { label: "City Centre", count: "22 Hotels" },
  { label: "Spa & Wellness", count: "11 Hotels" },
];

const perks = [
  {
    title: "Personally Vetted",
    description: "Every hotel is personally inspected and approved by our concierge team — no algorithm, just genuine experience.",
  },
  {
    title: "Best Rate Guarantee",
    description: "We negotiate exclusive rates and added perks you won't find booking direct or through other platforms.",
  },
  {
    title: "VIP Welcome",
    description: "Our hotel partners know our guests by name. Expect room upgrades, welcome gifts, and priority check-in.",
  },
  {
    title: "24/7 Support",
    description: "Something not right at the hotel? Our team is available around the clock to resolve any issue immediately.",
  },
];

export default async function HotelsPage() {
  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, city, whatsapp_number, logo_url")
    .order("created_at", { ascending: false });

  const hotelList = hotels ?? [];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white py-28 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Curated Accommodation
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-5">
            Handpicked Hotels Across the UK
          </h1>
          <div className="w-16 h-1 bg-blue-400 mx-auto mb-5 rounded-full" />
          <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            From London&apos;s iconic five-star addresses to hidden countryside gems —
            every hotel we recommend has been personally vetted by our team.
          </p>
          <div className="mt-8">
            <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">
              Request a Booking
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.label}
                className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 flex items-center justify-center mb-2 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <p className="text-slate-800 font-semibold text-sm group-hover:text-blue-700">{cat.label}</p>
                <p className="text-blue-600 text-xs mt-0.5 font-medium">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Hotels */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">Partner Properties</span>
            <h2 className="section-heading">Our Partner Hotels</h2>
            <div className="blue-divider" />
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              A selection of the finest properties our guests return to time and again — each one a destination in itself.
            </p>
          </div>

          {hotelList.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg font-medium mb-2">Partner hotels coming soon</p>
              <p className="text-slate-400 text-sm mb-6">We are onboarding our hotel partners. In the meantime, contact us for recommendations.</p>
              <Link href="/contact" className="btn-primary">Contact Our Concierge</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hotelList.map((hotel, i) => (
                  <div key={hotel.id} className="card group flex flex-col">
                    <div className="flex items-start justify-between mb-5">
                      {hotel.logo_url ? (
                        <Image
                          unoptimized
                          src={hotel.logo_url}
                          alt={hotel.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white font-bold text-xl flex items-center justify-center font-serif shadow-lg group-hover:scale-105 transition-transform`}>
                          {hotel.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                        Partner Hotel
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {hotel.city}
                    </p>

                    <div className="flex-1" />

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                      {hotel.whatsapp_number ? (
                        <a
                          href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold hover:text-emerald-700 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </a>
                      ) : (
                        <span />
                      )}
                      <Link href="/contact" className="btn-outline-blue text-sm py-2 px-5">
                        Enquire
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-slate-500 mb-4">
                  Don&apos;t see what you&apos;re looking for? Contact our concierge for a personalised recommendation.
                </p>
                <Link href="/contact" className="btn-primary">
                  Request a Custom Hotel
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why book with us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">Why Book With Us</span>
            <h2 className="section-heading">More Than Just a Room</h2>
            <div className="blue-divider" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {perks.map((perk) => (
              <div key={perk.title} className="card text-center group">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{perk.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[
              { n: `${hotelList.length || "75"}+`, l: "Partner Hotels" },
              { n: "15+", l: "UK Destinations" },
              { n: "500+", l: "Happy Guests" },
              { n: "100%", l: "Personally Vetted" },
            ].map(({ n, l }) => (
              <div key={l} className="py-2">
                <p className="text-3xl md:text-4xl font-bold font-serif">{n}</p>
                <p className="text-blue-100 text-sm mt-1 tracking-wide">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-hero-gradient py-20 text-center text-white px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Let Us Find Your Perfect Hotel
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Tell us your dates, destination, and preferences — our concierge team will present a curated shortlist within 24 hours.
          </p>
          <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">
            Start Your Search
          </Link>
        </div>
      </section>
    </>
  );
}
