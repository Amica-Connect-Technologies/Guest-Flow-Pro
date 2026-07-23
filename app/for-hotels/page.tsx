import type { Metadata } from "next";
import ForHotelsView from "./ForHotelsView";

export const metadata: Metadata = {
  title: "For Hotels | GuestFlowPro — Digital Concierge Platform",
  description:
    "Give every guest a 5-star concierge experience — without hiring one. GuestFlowPro puts a digital concierge in every guest's pocket. Setup in 48 hours.",
  alternates: {
    canonical: "https://guestflowpro.com/for-hotels",
    languages: {
      "en": "https://guestflowpro.com/for-hotels",
      "it": "https://guestflowpro.com/for-hotels/it",
    },
  },
  openGraph: {
    title: "For Hotels | GuestFlowPro",
    description:
      "Reservations, pre-arrival, local experiences, spa, events — all in one link, available 24/7.",
    type: "website",
    locale: "en_GB",
  },
};

export default function ForHotelsPage() {
  return <ForHotelsView />;
}
