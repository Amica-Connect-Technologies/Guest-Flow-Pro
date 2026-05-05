import Link from "next/link";

/* ── Inline SVG icons ──────────────────────────────────────────── */
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
const ForkKnifeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
  </svg>
);
const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8 8 0 10-16 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

/* ── Data ──────────────────────────────────────────────────────── */
const quickServices = [
  { label: "Hotels", icon: <BuildingIcon />, href: "/hotels", bg: "bg-blue-50", text: "text-blue-600" },
  { label: "Transfers", icon: <PlaneIcon />, href: "/contact", bg: "bg-sky-50", text: "text-sky-600" },
  { label: "Dining", icon: <ForkKnifeIcon />, href: "/contact", bg: "bg-orange-50", text: "text-orange-600" },
  { label: "Tours", icon: <MapIcon />, href: "/contact", bg: "bg-emerald-50", text: "text-emerald-600" },
  { label: "Concierge", icon: <BellIcon />, href: "/contact", bg: "bg-violet-50", text: "text-violet-600" },
  { label: "Languages", icon: <GlobeIcon />, href: "/contact", bg: "bg-rose-50", text: "text-rose-600" },
];

const services = [
  { icon: <BuildingIcon />, title: "Hotel Reservations", description: "Handpicked luxury and boutique hotels across the UK with exclusive Italian-inspired hospitality.", color: "bg-blue-600" },
  { icon: <PlaneIcon />, title: "Airport Transfers", description: "Seamless, punctual transfers from all major UK airports — available 24 hours a day.", color: "bg-sky-500" },
  { icon: <ForkKnifeIcon />, title: "Fine Dining & Ristoranti", description: "Table reservations at Michelin-starred establishments and the finest Italian restaurants.", color: "bg-orange-500" },
  { icon: <MapIcon />, title: "Guided Tours & Culture", description: "Curated cultural experiences blending British heritage with Italian passion for history.", color: "bg-emerald-600" },
  { icon: <BellIcon />, title: "Personal Concierge", description: "A dedicated bilingual concierge — fluent in Italian and English — around the clock.", color: "bg-violet-600" },
  { icon: <GlobeIcon />, title: "Multilingual Support", description: "We serve guests from every corner of the world in Italian, English, and multiple languages.", color: "bg-rose-500" },
];

const stats = [
  { stat: "500+", label: "Happy Guests" },
  { stat: "24/7", label: "Concierge Support" },
  { stat: "15+", label: "UK Destinations" },
  { stat: "10+", label: "Languages" },
];

const testimonials = [
  { name: "Marco Bianchi", origin: "Rome, Italy", quote: "Guest Flow Pro made our London trip absolutely magical. We felt at home from the moment we landed.", initials: "MB" },
  { name: "Sophie Dubois", origin: "Paris, France", quote: "Exceptional service — the team arranged everything perfectly, from our hotel to a private cooking class!", initials: "SD" },
  { name: "Kenji Tanaka", origin: "Tokyo, Japan", quote: "Professional, warm, and detail-oriented. Highly recommended for anyone visiting the UK.", initials: "KT" },
];

const whyUs = [
  "Personally assigned bilingual concierge",
  "Exclusive partnerships with top UK hotels",
  "Tailored itineraries for every culture",
  "Transparent pricing — no hidden fees",
];

/* ── Page ──────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-6 pt-8 pb-10 md:min-h-[92vh] md:flex md:flex-col md:items-center md:justify-center md:text-center md:py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Benvenuti — Welcome to Guest Flow Pro
          </div>

          <h1 className="text-4xl md:text-7xl font-serif font-bold text-white leading-tight mb-5">
            Italian Hospitality
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-white bg-clip-text text-transparent">
              in the Heart of the UK
            </span>
          </h1>

          <p className="text-slate-300 text-base md:text-xl max-w-2xl md:mx-auto mb-8 leading-relaxed">
            Guest Flow Pro brings the warmth, elegance, and passion of Italy to
            your United Kingdom experience — tailored for travellers worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:justify-center mb-10">
            <Link href="/contact" className="btn-primary text-base shadow-blue-900/40 shadow-xl active:scale-95 transition-transform">
              Book Your Stay
            </Link>
            <Link href="/about" className="btn-outline text-base active:scale-95 transition-transform">
              Discover More
            </Link>
          </div>

          {/* Mobile stat pills */}
          <div className="flex flex-wrap gap-2 md:hidden">
            {stats.map(({ stat, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-white font-bold text-lg font-serif leading-none">{stat}</p>
                <p className="text-blue-200 text-[10px] font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Desktop trust badges */}
          <div className="hidden md:flex mt-14 flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-medium">
            {["Secure Booking", "5-Star Rated", "Verified Service", "Global Guests"].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <ShieldIcon />
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="md:hidden h-6 bg-slate-50 rounded-t-3xl" />
      </section>


      {/* ── Quick Services (mobile horizontal scroll) ─────────── */}
      <section className="md:hidden bg-slate-50 py-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Our Services</h2>
          <Link href="/contact" className="text-blue-600 text-xs font-semibold flex items-center gap-1">
            View all <ArrowRightIcon />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {quickServices.map(({ label, icon, href, bg, text }) => (
            <Link
              key={label}
              href={href}
              className="flex-shrink-0 flex flex-col items-center gap-2 bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100 active:scale-95 transition-transform min-w-[76px]"
            >
              <div className={`w-11 h-11 rounded-xl ${bg} ${text} flex items-center justify-center`}>
                {icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>


      {/* ── Desktop Stats Strip ───────────────────────────────── */}
      <section className="hidden md:block bg-blue-600 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-6 text-white text-center">
            {stats.map(({ stat, label }) => (
              <div key={label} className="py-2">
                <p className="text-4xl font-bold font-serif">{stat}</p>
                <p className="text-blue-100 text-sm mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Stats Grid */}
      <section className="md:hidden bg-slate-50 px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ stat, label }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold font-serif text-blue-600">{stat}</p>
              <p className="text-slate-500 text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── Services ─────────────────────────────────────────── */}
      <section className="py-8 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          {/* Desktop heading */}
          <div className="hidden md:block text-center mb-16">
            <span className="badge">Our Services</span>
            <h2 className="section-heading">Everything You Need, Curated for You</h2>
            <div className="blue-divider" />
            <p className="text-slate-500 max-w-xl mx-auto mt-4">
              From arrival to departure, we handle every detail so you can focus
              on experiencing the very best of the United Kingdom.
            </p>
          </div>

          {/* Mobile heading */}
          <h2 className="md:hidden text-base font-bold text-slate-900 mb-4">What We Offer</h2>

          {/* Mobile: vertical card list */}
          <div className="md:hidden space-y-3">
            {services.map((s) => (
              <div key={s.title} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform">
                <div className={`w-11 h-11 rounded-xl ${s.color} text-white flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">{s.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: 3-col grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="card group">
                <div className={`w-12 h-12 rounded-xl ${s.color} text-white flex items-center justify-center mb-5 group-hover:scale-110 transform transition-transform duration-300`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Why Us ───────────────────────────────────────────── */}
      <section className="py-8 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-6 md:grid md:grid-cols-2 md:gap-16 md:items-center">
          <div>
            <h2 className="md:hidden text-base font-bold text-slate-900 mb-4">Why Choose Us?</h2>

            <div className="hidden md:block">
              <span className="badge">Why Choose Us</span>
              <h2 className="section-heading mb-4">La Dolce Vita —<br />Right Here in Britain</h2>
              <div className="w-12 h-1 bg-blue-600 rounded-full mb-6" />
              <p className="text-slate-500 leading-relaxed mb-6">
                We are a team of passionate Italian hospitality professionals based in the UK,
                dedicated to making every guest feel like a cherished family member.
              </p>
            </div>

            <div className="space-y-3">
              {whyUs.map((item) => (
                <div key={item} className="flex items-center gap-3 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none p-3 md:p-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <CheckIcon />
                  </div>
                  <span className="text-slate-700 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/about" className="btn-outline-blue text-sm">Learn More About Us</Link>
            </div>
          </div>

          {/* Desktop visual card */}
          <div className="hidden md:block relative">
            <div className="rounded-2xl bg-hero-gradient p-10 text-white shadow-2xl shadow-blue-900/30">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">Trusted by guests from</p>
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
          </div>
        </div>
      </section>


      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-8 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="px-5 md:px-6 md:text-center mb-5 md:mb-16">
            <span className="badge hidden md:inline-block">Testimonials</span>
            <h2 className="text-base font-bold text-slate-900 md:section-heading">What Our Guests Say</h2>
            <div className="blue-divider hidden md:block" />
          </div>

          {/* Mobile: snap horizontal scroll */}
          <div className="md:hidden flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2 snap-x snap-mandatory">
            {testimonials.map((t) => (
              <div key={t.name} className="flex-shrink-0 w-72 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 snap-start">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">{t.initials}</div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                    <p className="text-blue-600 text-[10px] font-medium flex items-center gap-0.5">
                      <LocationIcon /> {t.origin}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: 3-col grid */}
          <div className="hidden md:grid grid-cols-3 gap-8 px-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card relative">
                <div className="absolute top-6 right-8 text-blue-100 text-6xl font-serif leading-none select-none">"</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">{t.initials}</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-blue-600 font-medium">{t.origin}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, i) => <StarIcon key={i} />)}</div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Trust Badges (mobile only) ────────────────────────── */}
      <section className="md:hidden bg-white py-6 px-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <ShieldIcon />, label: "Secure Booking" },
            { icon: <StarIcon />, label: "5-Star Rated" },
            { icon: <CheckIcon />, label: "Verified Service" },
            { icon: <GlobeIcon />, label: "Global Guests" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
              <div className="text-blue-600">{icon}</div>
              <span className="text-slate-700 text-xs font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ── CTA ──────────────────────────────────────────────── */}
      {/* Mobile CTA card */}
      <section className="md:hidden py-8 px-5 bg-slate-50">
        <div className="bg-hero-gradient rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
              Ready to Book?
            </span>
            <h2 className="text-2xl font-serif font-bold mb-2">Start Your Journey Today</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Contact our concierge team and let us design the perfect UK experience for you.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Get in Touch <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Desktop CTA */}
      <section className="hidden md:block relative bg-hero-gradient py-24 text-center text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Ready to Experience Italy in the UK?
          </span>
          <h2 className="text-4xl font-serif font-bold mb-5">Start Your Journey Today</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Contact our concierge team and let us design the perfect UK experience for you and your loved ones.
          </p>
          <Link href="/contact" className="btn-primary text-base shadow-blue-900/50 shadow-xl">Get in Touch</Link>
        </div>
      </section>
    </>
  );
}
