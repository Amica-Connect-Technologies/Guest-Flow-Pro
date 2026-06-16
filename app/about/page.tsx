import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "About Us | Guest Flow Pro",
  description:
    "Learn about Guest Flow Pro — an Italian-founded concierge team bringing authentic hospitality to UK-bound travellers worldwide.",
};

export default function AboutPage() {
  return <AboutContent />;
}
