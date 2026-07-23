import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import ForceLang from "@/components/ForceLang";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guestflowpro.com";

export const metadata: Metadata = {
  title: "Concierge Digitale | Amica International",
  description:
    "Il tuo concierge digitale. Scopri ristoranti locali, prenota servizi dell'hotel, esplora tour e attrazioni — tutto dal tuo telefono, 24/7.",
  alternates: {
    languages: {
      en: `${BASE_URL}/`,
      it: `${BASE_URL}/it`,
      es: `${BASE_URL}/es`,
      "x-default": `${BASE_URL}/`,
    },
  },
  openGraph: {
    title: "Concierge Digitale | Amica International",
    description:
      "Scopri ristoranti locali, prenota servizi dell'hotel, esplora tour — tutto dal tuo telefono, 24/7.",
    type: "website",
  },
};

export default function ItalianHome() {
  return (
    <>
      {/* Forces the i18n context to Italian and persists it to localStorage */}
      <ForceLang lang="it" />
      <HomeView />
    </>
  );
}
