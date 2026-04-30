import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hotels | Guest Flow Pro",
  description:
    "Discover handpicked luxury and boutique hotels across the UK, curated by our Italian concierge team for an unforgettable stay.",
};

const hotels = [
  {
    name: "The Mayfair Grand",
    location: "London, Mayfair",
    category: "Luxury 5-Star",
    description:
      "An iconic address in the heart of London's most prestigious neighbourhood, offering world-class service and timeless elegance.",
    features: ["Michelin Restaurant", "Spa & Wellness", "Butler Service", "Concierge"],
    priceFrom: "£450",
    initials: "MG",
    color: "bg-blue-700",
  },
  {
    name: "The Edinburgh Manor",
    location: "Edinburgh, Old Town",
    category: "Historic Boutique",
    description:
      "A beautifully restored Georgian manor steps from Edinburgh Castle, blending Scottish heritage with contemporary luxury.",
    features: ["Castle Views", "Whisky Bar", "Scottish Dining", "City Tours"],
    priceFrom: "£280",
    initials: "EM",
    color: "bg-slate-700",
  },
  {
    name: "Cotswolds Country House",
    location: "Bourton-on-the-Water",
    category: "Country Retreat",
    description:
      "A serene escape in the rolling Cotswolds countryside — perfect for couples seeking peace, gardens, and quintessential England.",
    features: ["Private Gardens", "Afternoon Tea", "Countryside Walks", "Spa"],
    priceFrom: "£320",
    initials: "CC",
    color: "bg-emerald-700",
  },
  {
    name: "The Bath Regency",
    location: "Bath, City Centre",
    category: "Heritage Hotel",
    description:
      "Set within a stunning Regency-era building overlooking the Roman Baths, this hotel is a gateway to Bath's rich history.",
    features: ["Roman Baths Access", "Georgian Spa", "Fine Dining", "City Views"],
    priceFrom: "£260",
    initials: "BR",
    color: "bg-amber-700",
  },
  {
    name: "Manchester City Loft",
    location: "Manchester, Northern Quarter",
    category: "Design Hotel",
    description:
      "A chic, design-forward hotel in Manchester's vibrant arts district — ideal for modern travellers exploring the North.",
    features: ["Rooftop Bar", "Art Gallery", "Gym", "Co-Working Space"],
    priceFrom: "£180",
    initials: "MC",
    color: "bg-purple-700",
  },
  {
    name: "The Oxford Scholar",
    location: "Oxford, City Centre",
    category: "Boutique Hotel",
    description:
      "Steps from the dreaming spires of Oxford's ancient colleges, this intimate hotel captures the essence of scholarly Britain.",
    features: ["College Views", "Library Lounge", "Garden Terrace", "Cycling Tours"],
    priceFrom: "£220",
    initials: "OS",
    color: "bg-blue-600",
  },
];

const categories = [
  { icon: "👑", label: "Luxury 5-Star", count: "12 Hotels" },
  { icon: "🏡", label: "Boutique & Intimate", count: "18 Hotels" },
  { icon: "🌿", label: "Country Retreats", count: "9 Hotels" },
  { icon: "🏛️", label: "Historic Properties", count: "14 Hotels" },
  { icon: "🌆", label: "City Centre", count: "22 Hotels" },
  { icon: "🧘", label: "Spa & Wellness", count: "11 Hotels" },
];

const perks = [
  {
    icon: "✅",
    title: "Personally Vetted",
    description: "Every hotel is personally inspected and approved by our concierge team — no algorithm, just genuine experience.",
  },
  {
    icon: "💰",
    title: "Best Rate Guarantee",
    description: "We negotiate exclusive rates and added perks you won't find booking direct or through other platforms.",
  },
  {
    icon: "🤝",
    title: "VIP Welcome",
    description: "Our hotel partners know our guests by name. Expect room upgrades, welcome gifts, and priority check-in.",
  },
  {
    icon: "📞",
    title: "24/7 Support",
    description: "Something not right at the hotel? Our team is available around the clock to resolve any issue immediately.",
  },
];

export default function HotelsPage() {
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
            From London's iconic five-star addresses to hidden countryside gems —
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
                <span className="text-3xl mb-2">{cat.icon}</span>
                <p className="text-slate-800 font-semibold text-sm group-hover:text-blue-700">
                  {cat.label}
                </p>
                <p className="text-blue-600 text-xs mt-0.5 font-medium">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">Featured Properties</span>
            <h2 className="section-heading">Our Most Loved Hotels</h2>
            <div className="blue-divider" />
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              A selection of the finest properties our guests return to time and
              again — each one a destination in itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <div key={hotel.name} className="card group flex flex-col">
                {/* Hotel avatar */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl ${hotel.color} text-white font-bold text-xl flex items-center justify-center font-serif shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    {hotel.initials}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {hotel.category}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {hotel.name}
                </h3>
                <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span>📍</span> {hotel.location}
                </p>
                <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">
                  {hotel.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {hotel.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">From</p>
                    <p className="text-xl font-bold text-slate-900 font-serif">
                      {hotel.priceFrom}
                      <span className="text-xs font-normal text-slate-400 ml-1">/ night</span>
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="btn-outline-blue text-sm py-2 px-5"
                  >
                    Enquire
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-500 mb-4">
              Don't see what you're looking for? We have access to 75+ properties across the UK.
            </p>
            <Link href="/contact" className="btn-primary">
              Request a Custom Hotel
            </Link>
          </div>
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
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                  {perk.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {perk.title}
                </h3>
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
              { n: "75+", l: "Partner Hotels" },
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
            Tell us your dates, destination, and preferences — our concierge team
            will present a curated shortlist within 24 hours.
          </p>
          <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">
            Start Your Search
          </Link>
        </div>
      </section>
    </>
  );
}
