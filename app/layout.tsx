import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Amica Concierge | Italian Hotel Services in the UK",
  description:
    "Experience authentic Italian hospitality in the United Kingdom. Amica Concierge offers premium hotel services for worldwide tourists — from airport transfers to guided tours and fine dining reservations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
