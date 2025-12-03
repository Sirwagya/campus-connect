"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Inbox, Send, File, AlertOctagon, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MailCategory } from "@/types/mail";

const navItems: { category: MailCategory; label: string; icon: any }[] = [
  { category: "inbox", label: "Inbox", icon: Inbox },
  { category: "sent", label: "Sent", icon: Send },
  { category: "draft", label: "Drafts", icon: File },
  { category: "spam", label: "Spam", icon: AlertOctagon },
  { category: "trash", label: "Trash", icon: Trash2 },
];

export function MailSidebar() {
  const searchParams = useSearchParams();
  const currentCategory =
    (searchParams.get("category") as MailCategory) || "inbox";

  return (
    <aside className="w-64 bg-[#0E0E10] border-r border-white/10 flex flex-col py-4">
      <div className="px-6 mb-6">
        <h2 className="text-xl font-bold text-white">Mail</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentCategory === item.category;
          return (
            <Link
              key={item.category}
              href={`/mail?category=${item.category}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
