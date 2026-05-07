import type { Metadata } from "next";
import ToursView from "@/components/ToursView";

export const metadata: Metadata = {
  title: "Tours | Digital Concierge",
  description:
    "Discover handpicked tours and experiences across the UK — from historical landmarks to nature adventures, curated by our concierge team.",
};

export default function ToursPage() {
  return <ToursView />;
}
