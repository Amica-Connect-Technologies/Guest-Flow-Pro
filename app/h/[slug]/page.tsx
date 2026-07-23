import type { Metadata } from "next";
import ConciergeView from "@/components/ConciergeView";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guestflowpro.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const META_DESCRIPTIONS: Record<string, string> = {
  en: "Welcome to {hotelName}. Book services, explore local experiences and reach our digital concierge 24/7.",
  it: "Benvenuto al {hotelName}. Prenota servizi, scopri esperienze locali e contatta il nostro concierge digitale 24/7.",
  es: "Bienvenido a {hotelName}. Reserve servicios, explore experiencias locales y contacte nuestro conserje digital 24/7.",
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang: urlLang } = await searchParams;

  let hotelName = "Hotel";
  let defaultLang = "it";

  try {
    const res = await fetch(`${API_BASE}/api/hotels/${slug}/`, { cache: "no-store" });
    if (res.ok) {
      const hotel = await res.json();
      hotelName = hotel.name || "Hotel";
      defaultLang = hotel.language_default || "it";
    }
  } catch {}

  const lang = ["en", "it", "es"].includes(urlLang || "") ? (urlLang as string) : defaultLang;
  const descTemplate = META_DESCRIPTIONS[lang] || META_DESCRIPTIONS.en;
  const description = descTemplate.replace("{hotelName}", hotelName);
  const title = `${hotelName} | Digital Concierge`;

  return {
    title,
    description,
    alternates: {
      languages: {
        "it": `${BASE_URL}/h/${slug}?lang=it`,
        "en": `${BASE_URL}/h/${slug}?lang=en`,
        "es": `${BASE_URL}/h/${slug}?lang=es`,
        "x-default": `${BASE_URL}/h/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function HotelConcierge({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ConciergeView hotelId={slug} />;
}
