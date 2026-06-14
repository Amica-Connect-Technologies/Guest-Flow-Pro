import type { Metadata } from "next";
import "./globals.css";
import PublicLayout from "@/components/PublicLayout";
import { LanguageProvider } from "@/lib/LanguageContext";

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
      <body className="flex flex-col min-h-screen bg-white">
        <LanguageProvider>
          <PublicLayout>{children}</PublicLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
