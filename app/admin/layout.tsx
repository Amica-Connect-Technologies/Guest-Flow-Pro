import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
      <AdminNav />
    </div>
  );
}
