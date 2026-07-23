import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import ForceLang from "@/components/ForceLang";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guestflowpro.com";

export const metadata: Metadata = {
  title: "Conserje Digital | Amica International",
  description:
    "Tu conserje digital. Descubre restaurantes locales, reserva servicios del hotel, explora tours y atracciones — todo desde tu teléfono, 24/7.",
  alternates: {
    languages: {
      en: `${BASE_URL}/`,
      it: `${BASE_URL}/it`,
      es: `${BASE_URL}/es`,
      "x-default": `${BASE_URL}/`,
    },
  },
  openGraph: {
    title: "Conserje Digital | Amica International",
    description:
      "Descubre restaurantes locales, reserva servicios del hotel, explora tours — todo desde tu teléfono, 24/7.",
    type: "website",
  },
};

export default function SpanishHome() {
  return (
    <>
      {/* Forces the i18n context to Spanish and persists it to localStorage */}
      <ForceLang lang="es" />
      <HomeView />
    </>
  );
}
