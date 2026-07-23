import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import GeoRedirect from "@/components/GeoRedirect";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guestflowpro.com";

export const metadata: Metadata = {
  title: "Digital Concierge | Amica International",
  description:
    "Your hotel's digital concierge. Discover local restaurants, book hotel services, explore tours and attractions — all from your phone, 24/7.",
  alternates: {
    languages: {
      en: `${BASE_URL}/`,
      it: `${BASE_URL}/it`,
      es: `${BASE_URL}/es`,
      "x-default": `${BASE_URL}/`,
    },
  },
  openGraph: {
    title: "Digital Concierge | Amica International",
    description:
      "Discover local restaurants, book hotel services, explore tours — all from your phone, 24/7.",
    type: "website",
  },
};

export default function RootPage() {
  return (
    <>
      {/* Silently detects country via IP and redirects to /it or /es if needed */}
      <GeoRedirect />
      <HomeView />
    </>
  );
}
