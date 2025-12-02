"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Users, Calendar, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/spaces", label: "Spaces", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Mail },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
