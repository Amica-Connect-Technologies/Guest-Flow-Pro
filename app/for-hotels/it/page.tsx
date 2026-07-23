import type { Metadata } from "next";
import ForHotelsViewIT from "../ForHotelsViewIT";

export const metadata: Metadata = {
  title: "Per Hotel | GuestFlowPro — Piattaforma Concierge Digitale",
  description:
    "Regala a ogni ospite un'esperienza da concierge stellato — senza assumere nessuno. GuestFlowPro mette un concierge digitale in tasca di ogni ospite. Attivo in 48 ore.",
  alternates: {
    canonical: "https://guestflowpro.com/for-hotels/it",
    languages: {
      "en": "https://guestflowpro.com/for-hotels",
      "it": "https://guestflowpro.com/for-hotels/it",
    },
  },
  openGraph: {
    title: "Per Hotel | GuestFlowPro",
    description:
      "Prenotazioni, pre-arrivo, esperienze locali, spa, eventi — tutto in un link, disponibile 24/7.",
    type: "website",
    locale: "it_IT",
  },
};

export default function ForHotelsItalianPage() {
  return <ForHotelsViewIT />;
}
