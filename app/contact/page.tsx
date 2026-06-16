import type { Metadata } from "next";
import ContactContent from "@/components/ContactContent";

export const metadata: Metadata = {
  title: "Contact Us | Guest Flow Pro",
  description:
    "Reach out to Guest Flow Pro for hotel bookings, concierge enquiries, and personalised UK travel planning.",
};

export default function ContactPage() {
  return <ContactContent />;
}
