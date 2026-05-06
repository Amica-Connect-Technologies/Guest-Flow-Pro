"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/login");

  return (
    <>
      {!isPrivate && (
        <>
          <div className="hidden md:block"><Navbar /></div>
          <MobileHeader />
        </>
      )}

      <main className={!isPrivate ? "flex-1 pt-14 md:pt-16 pb-20 md:pb-0" : "flex-1"}>
        {children}
      </main>

      {!isPrivate && (
        <>
          <div className="hidden md:block"><Footer /></div>
          <BottomNav />
        </>
      )}
    </>
  );
}
