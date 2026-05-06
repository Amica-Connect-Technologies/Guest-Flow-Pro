import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Tours | Guest Flow Pro",
  description: "Discover handpicked tours and experiences curated by our concierge team — from city sightseeing to cultural adventures.",
};

type Tour = { id: string; title: string; city: string; description: string; image: string; price: number; provider: string; affiliate_link: string };

export default async function ToursPage() {
  const { data } = await supabase
    .from("tours")
    .select("id, title, city, description, image, price, provider, affiliate_link")
    .order("created_at", { ascending: false });

  const tours: Tour[] = data ?? [];
  const cities = [...new Set(tours.map((t) => t.city).filter(Boolean))];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Curated Experiences
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-5">
            Tours & Experiences
          </h1>
          <div className="w-16 h-1 bg-emerald-400 mx-auto mb-5 rounded-full" />
          <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Handpicked tours, guided experiences, and unforgettable adventures — all bookable through our trusted partners.
          </p>
        </div>
      </section>

      {/* Cities filter strip */}
      {cities.length > 0 && (
        <section className="py-8 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 self-center mr-1">Browse by city:</span>
              {cities.map((city) => (
                <span key={city} className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tours grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge">All Tours</span>
            <h2 className="section-heading">Explore Our Tour Packages</h2>
            <div className="blue-divider" />
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              Book directly through our affiliate partners — GetYourGuide and Viator — for the best prices and instant confirmation.
            </p>
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg font-medium mb-2">Tour packages coming soon</p>
              <p className="text-slate-400 text-sm mb-6">We are curating the best tours. Contact us for personalised recommendations.</p>
              <Link href="/contact" className="btn-primary">Contact Our Concierge</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                  {/* Image */}
                  {tour.image ? (
                    <div className="relative h-48 overflow-hidden">
                      <Image unoptimized src={tour.image} alt={tour.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-lg ${tour.provider === "GYG" ? "bg-orange-500 text-white" : "bg-blue-600 text-white"}`}>
                        {tour.provider === "GYG" ? "GetYourGuide" : "Viator"}
                      </span>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center relative">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-16 h-16 text-slate-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-lg ${tour.provider === "GYG" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                        {tour.provider === "GYG" ? "GetYourGuide" : "Viator"}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{tour.city}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors leading-snug">{tour.title}</h3>
                    {tour.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">{tour.description}</p>}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div>
                        {tour.price ? (
                          <>
                            <p className="text-xs text-slate-400">From</p>
                            <p className="text-xl font-bold text-slate-900">${tour.price}<span className="text-xs font-normal text-slate-400 ml-1">/ person</span></p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-emerald-600">Free</p>
                        )}
                      </div>
                      {tour.affiliate_link ? (
                        <a href={tour.affiliate_link} target="_blank" rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200">
                          Book Now
                        </a>
                      ) : (
                        <Link href="/contact" className="btn-outline-blue text-sm py-2 px-4">Enquire</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-hero-gradient py-20 text-center text-white px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Can&apos;t Find What You&apos;re Looking For?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Our concierge team can arrange bespoke tours and private experiences tailored exactly to your interests.
          </p>
          <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">Talk to Our Concierge</Link>
        </div>
      </section>
    </>
  );
}
