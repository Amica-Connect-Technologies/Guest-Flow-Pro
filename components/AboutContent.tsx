"use client";

import Link from "next/link";
import { Handshake, Sparkles, Leaf, Globe, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function AboutContent() {
  const { t } = useLanguage();

  const team = [
    { key: "giulia" as const, name: "Giulia Romano", initials: "GR", color: "bg-blue-600" },
    { key: "james" as const, name: "James Harrison", initials: "JH", color: "bg-navy-700" },
    { key: "sofia" as const, name: "Sofia Esposito", initials: "SE", color: "bg-blue-500" },
  ];

  const values: { key: keyof typeof t.about.values; Icon: LucideIcon }[] = [
    { key: "warmth", Icon: Handshake },
    { key: "excellence", Icon: Sparkles },
    { key: "authenticity", Icon: Leaf },
    { key: "welcome", Icon: Globe },
  ];

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
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
            {t.about.whoWeAre}
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-5">
            {t.about.title}
          </h1>
          <div className="w-16 h-1 bg-blue-400 mx-auto mb-5 rounded-full" />
          <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="badge">{t.about.ourStory}</span>
            <h2 className="section-heading mb-4">{t.about.storyTitle}</h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mb-6" />
            <div className="space-y-4 text-slate-500 leading-relaxed text-sm md:text-base">
              <p>{t.about.story1}</p>
              <p>{t.about.story2}</p>
              <p>{t.about.story3}</p>
            </div>
            <div className="mt-8">
              <Link href="/contact" className="btn-primary">
                {t.about.planVisit}
              </Link>
            </div>
          </div>

          {/* Stats visual */}
          <div className="relative">
            <div className="rounded-2xl bg-hero-gradient p-10 text-white shadow-2xl shadow-blue-900/30">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">
                {t.about.founded}
              </p>
              <p className="text-5xl font-serif font-bold text-white mb-8">2012</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: "500+", l: t.about.guestsServed },
                  { n: "10+", l: t.about.languages },
                  { n: "15+", l: t.about.destinations },
                  { n: "24/7", l: t.about.support },
                ].map(({ n, l }) => (
                  <div key={l} className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <p className="text-2xl font-bold text-blue-200">{n}</p>
                    <p className="text-xs text-blue-300 mt-0.5 tracking-wide">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-navy-900/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">{t.about.ourValues}</span>
            <h2 className="section-heading">{t.about.valuesTitle}</h2>
            <div className="blue-divider" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => {
              const value = t.about.values[v.key];
              return (
                <div key={v.key} className="card text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <v.Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge">{t.about.meetTeam}</span>
            <h2 className="section-heading">{t.about.teamTitle}</h2>
            <div className="blue-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => {
              const info = t.about.team[member.key];
              return (
                <div key={member.name} className="card text-center group">
                  <div className={`w-20 h-20 rounded-2xl ${member.color} text-white font-bold text-2xl flex items-center justify-center mx-auto mb-5 shadow-lg font-serif group-hover:scale-105 transition-transform`}>
                    {member.initials}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{member.name}</h3>
                  <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-4">
                    {info.role}
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">{info.bio}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-hero-gradient py-20 text-center text-white px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            {t.about.ctaTitle}
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            {t.about.ctaSubtitle}
          </p>
          <Link href="/contact" className="btn-primary shadow-blue-900/50 shadow-xl">
            {t.about.contactUs}
          </Link>
        </div>
      </section>
    </>
  );
}
