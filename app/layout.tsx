import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Guest Flow Pro | Italian Hotel Services in the UK",
  description:
    "Experience authentic Italian hospitality in the United Kingdom. Guest Flow Pro offers premium hotel concierge services for worldwide tourists — from airport transfers to guided tours and fine dining reservations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 md:bg-white">
        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:block">
          <Navbar />
        </div>
        {/* Mobile app header — hidden on desktop */}
        <MobileHeader />

        <main className="flex-1 pt-14 md:pt-16 pb-20 md:pb-0">
          {children}
        </main>

        {/* Desktop footer — hidden on mobile */}
        <div className="hidden md:block">
          <Footer />
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </body>
    </html>
  );
}
