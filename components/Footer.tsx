import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-800 via-blue-500 to-blue-800" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">G</span>
              </div>
              <span className="font-serif text-white text-xl font-bold tracking-tight">
                Guest Flow Pro
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Bringing the warmth of Italian hospitality to the heart of the
              United Kingdom — your trusted partner for an unforgettable stay.
            </p>
            <div className="flex gap-3 mt-5">
              {["f", "in", "ig"].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-lg bg-navy-800 border border-white/10 flex items-center justify-center text-xs text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer font-semibold"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-600 group-hover:w-2 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">📍</span>
                <span>London, United Kingdom</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">📧</span>
                <a
                  href="mailto:amicainternationalservices@gmail.com"
                  className="hover:text-blue-400 transition-colors break-all"
                >
                  amicainternationalservices@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">🕐</span>
                <span>24 / 7 Concierge Service</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">🌍</span>
                <span>Serving Worldwide Guests</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Guest Flow Pro. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            London, UK · Est. 2012
          </p>
        </div>
      </div>
    </footer>
  );
}
