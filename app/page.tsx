import Link from "next/link";

const services = [
  {
    icon: "🏨",
    title: "Hotel Reservations",
    description:
      "Handpicked luxury and boutique hotels across the UK with exclusive Italian-inspired hospitality and personalised service.",
  },
  {
    icon: "✈️",
    title: "Airport Transfers",
    description:
      "Seamless, punctual transfers from all major UK airports directly to your accommodation — available 24 hours a day.",
  },
  {
    icon: "🍝",
    title: "Fine Dining & Ristoranti",
    description:
      "Table reservations at the finest Italian restaurants and Michelin-starred establishments throughout the United Kingdom.",
  },
  {
    icon: "🎭",
    title: "Guided Tours & Culture",
    description:
      "Curated cultural experiences blending British heritage with the Italian passion for art, history, and la dolce vita.",
  },
  {
    icon: "🛎️",
    title: "Personal Concierge",
    description:
      "A dedicated bilingual concierge — fluent in Italian and English — available around the clock for your every need.",
  },
  {
    icon: "🌍",
    title: "Multilingual Support",
    description:
      "We serve guests from every corner of the world, offering support in Italian, English, and multiple languages.",
  },
];

const stats = [
  { stat: "500+", label: "Happy Guests" },
  { stat: "24/7", label: "Concierge Support" },
  { stat: "15+", label: "UK Destinations" },
  { stat: "10+", label: "Languages Supported" },
];

const testimonials = [
  {
    name: "Marco Bianchi",
    origin: "Rome, Italy",
    quote:
      "Amica Concierge made our London trip absolutely magical. We felt at home from the moment we landed.",
    initials: "MB",
  },
  {
    name: "Sophie Dubois",
    origin: "Paris, France",
    quote:
      "Exceptional service — the team arranged everything perfectly, from our hotel to a private cooking class!",
    initials: "SD",
  },
  {
    name: "Kenji Tanaka",
    origin: "Tokyo, Japan",
    quote:
      "Professional, warm, and detail-oriented. Highly recommended for anyone visiting the UK.",
    initials: "KT",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-hero-gradient">
        {/* Decorative blurred circles */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Benvenuti — Welcome to Amica Concierge
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6">
            Italian Hospitality
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-white bg-clip-text text-transparent">
              in the Heart of the UK
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Amica Concierge brings the warmth, elegance, and passion of Italy to
            your United Kingdom experience — tailored for travellers from around
            the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary text-base shadow-blue-900/40 shadow-xl">
              Book Your Stay
            </Link>
            <Link href="/about" className="btn-outline text-base">
              Discover More
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-medium">
            {["🔒 Secure Booking", "⭐ 5-Star Rated", "✅ Verified Service", "🌐 Global Guests"].map((b) => (
              <span key={b} className="flex items-center gap-1">{b}</span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-blue-400 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {stats.map(({ stat, label }) => (
              <div key={label} className="py-2">
                <p className="text-3xl md:text-4xl font-bold font-serif">{stat}</p>
                <p className="text-blue-100 text-sm mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">Our Services</span>
            <h2 className="section-heading">Everything You Need, Curated for You</h2>
            <div className="blue-divider" />
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              From arrival to departure, we handle every detail so you can focus
              on experiencing the very best of the United Kingdom.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="card group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-5 group-hover:bg-blue-600 transition-colors duration-300 group-hover:scale-110 transform">
                  <span className="group-hover:grayscale-0">{s.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="badge">Why Choose Us</span>
            <h2 className="section-heading mb-4">
              La Dolce Vita —<br />Right Here in Britain
            </h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mb-6" />
            <p className="text-slate-500 leading-relaxed mb-6">
              We are a team of passionate Italian hospitality professionals based
              in the UK, dedicated to making every guest feel like a cherished
              family member — wherever in the world you come from.
            </p>
            <ul className="space-y-3 text-slate-700 text-sm">
              {[
                "Personally assigned bilingual concierge",
                "Exclusive partnerships with top UK hotels",
                "Tailored itineraries for every culture & preference",
                "Transparent pricing — no hidden fees",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/about" className="btn-outline-blue">
                Learn More About Us
              </Link>
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="rounded-2xl bg-hero-gradient p-10 text-white shadow-2xl shadow-blue-900/30">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">
                Trusted by guests from
              </p>
              <p className="text-4xl font-serif font-bold mb-8">80+ Countries</p>
              <div className="grid grid-cols-2 gap-5">
                {stats.map(({ stat, label }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                    <p className="text-2xl font-bold text-blue-200">{stat}</p>
                    <p className="text-xs text-blue-300 mt-1 tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-navy-800/30 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">Testimonials</span>
            <h2 className="section-heading">What Our Guests Say</h2>
            <div className="blue-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="card relative">
                <div className="absolute top-6 right-8 text-blue-100 text-6xl font-serif leading-none select-none">
                  "
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-blue-600 font-medium">{t.origin}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 text-sm mb-3">{"★★★★★"}</div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-hero-gradient py-24 text-center text-white px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Ready to Experience Italy in the UK?
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-5">
            Start Your Journey Today
          </h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Contact our concierge team and let us design the perfect UK
            experience for you and your loved ones.
          </p>
          <Link href="/contact" className="btn-primary text-base shadow-blue-900/50 shadow-xl">
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
