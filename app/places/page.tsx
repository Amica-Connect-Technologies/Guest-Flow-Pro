import type { Metadata } from "next";
import PlacesView from "@/components/PlacesView";

export const metadata: Metadata = {
  title: "Places | Digital Concierge",
  description:
    "Discover the best restaurants, museums, cafes, attractions and hidden gems across the UK — personally recommended by our concierge team.",
};

export default function PlacesPage() {
  return <PlacesView />;
}
