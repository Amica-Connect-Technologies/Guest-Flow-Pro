import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { MapPin, Mail, Clock, Globe, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Guest Flow Pro",
  description:
    "Reach out to Guest Flow Pro for hotel bookings, concierge enquiries, and personalised UK travel planning.",
};

const contactDetails: { Icon: LucideIcon; title: string; lines: string[]; href?: string }[] = [
  {
    Icon: MapPin,
    title: "Location",
    lines: ["London, United Kingdom", "Serving guests across the UK"],
  },
  {
    Icon: Mail,
    title: "Email",
    lines: ["amicainternationalservices@gmail.com"],
    href: "mailto:amicainternationalservices@gmail.com",
  },
  {
    Icon: Clock,
    title: "Availability",
    lines: ["24 hours a day, 7 days a week", "No request too small"],
  },
  {
    Icon: Globe,
    title: "Languages",
    lines: ["Italian · English · French", "Spanish · German & more"],
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Page hero */}
      <section className="relative bg-hero-gradient text-white py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Contattaci — Get in Touch
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-5">
            Contact Guest Flow Pro
          </h1>
          <div className="w-16 h-1 bg-blue-400 mx-auto mb-5 rounded-full" />
          <p className="text-slate-300 max-w-xl mx-auto text-lg leading-relaxed">
            We are here to help, every hour of every day. Our team will respond
            promptly with a personalised proposal for your stay.
          </p>
        </div>
      </section>

      {/* Contact grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info side */}
          <div>
            <span className="badge">How to Reach Us</span>
            <h2 className="section-heading mb-4">We Would Love to Hear From You</h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mb-8" />

            <div className="space-y-5">
              {contactDetails.map((item) => (
                <div key={item.title} className="flex gap-4 items-start bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <item.Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                    {item.lines.map((line, i) =>
                      item.href ? (
                        <a
                          key={i}
                          href={item.href}
                          className="block text-slate-500 text-sm hover:text-blue-600 transition-colors"
                        >
                          {line}
                        </a>
                      ) : (
                        <p key={i} className="text-slate-500 text-sm">{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Italian note */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-700 text-white text-[10px] font-bold tracking-wide">IT</span>
                <p className="text-blue-800 font-semibold text-sm">Parlate Italiano?</p>
              </div>
              <p className="text-blue-700 text-sm leading-relaxed">
                Feel free to contact us in Italian — it is our first language
                and a pleasure to assist you{" "}
                <em>nella vostra lingua madre</em>.
              </p>
            </div>
          </div>

          {/* Form side */}
          <ContactForm />
        </div>
      </section>

      {/* UK Destinations */}
      <section className="relative bg-hero-gradient py-20 text-white text-center px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            Based in London
          </span>
          <h2 className="text-3xl font-serif font-bold mb-3">
            Serving the Whole of the United Kingdom
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-10">
            From the Scottish Highlands to the Cornish coast — wherever your UK
            adventure takes you, Guest Flow Pro is by your side.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {["London", "Edinburgh", "Manchester", "Bath", "Oxford", "Cornwall", "Lake District", "York"].map((city) => (
              <div
                key={city}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-3 px-4 text-blue-100 font-medium text-sm tracking-wide transition-colors cursor-default backdrop-blur-sm"
              >
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
