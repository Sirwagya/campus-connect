"use client";

import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { useKeyboardShortcuts } from "@/hooks";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Component to register keyboard shortcuts
function KeyboardShortcuts() {
  useKeyboardShortcuts();
  return null;
}

export function ClientLayout({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isLandingPage = pathname === "/";

  if (loading) {
    return <LoadingSkeleton />;
  }

  // If on login page or landing page, render without sidebar/nav
  if (isLoginPage || isLandingPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <PresenceProvider>
          <KeyboardShortcuts />
          <KeyboardShortcutsHelp />
          <OfflineIndicator />
          <div className="flex min-h-screen flex-col md:flex-row bg-black text-white">
            <Sidebar />
            <main className="flex-1 w-full min-w-0 pb-16 md:pb-0">
              <div className="container mx-auto max-w-7xl p-4 md:p-8">
                {children}
              </div>
            </main>
            <BottomNav />
          </div>
        </PresenceProvider>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
