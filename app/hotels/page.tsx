import type { Metadata } from "next";
import HotelsView from "@/components/HotelsView";

export const metadata: Metadata = {
  title: "Hotels | Digital Concierge",
  description:
    "Discover handpicked luxury and boutique hotels across the UK, curated by our Italian concierge team for an unforgettable stay.",
};

export default function HotelsPage() {
  return <HotelsView />;
}
