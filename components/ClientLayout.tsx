"use client";

import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If on login page, render without sidebar/nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-black text-white">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 pb-16 md:pb-0">
        <div className="container mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
