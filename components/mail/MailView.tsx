"use client";

import { useState, useEffect } from "react";
import { Mail } from "@/types/mail";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trash2, Star, Reply } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface MailViewProps {
  mailId: string;
  onBack: () => void;
  onAction: () => void;
}

export function MailView({ mailId, onBack, onAction }: MailViewProps) {
  const [mail, setMail] = useState<Mail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMail() {
      setLoading(true);
      try {
        // We don't have a single mail endpoint yet, but we can filter the list or create one.
        // Or we can just fetch from the list endpoint if we had it.
        // Let's assume we can fetch it via a new endpoint or just filter.
        // Actually, for now, let's create a simple endpoint or just use the list endpoint with ID?
        // No, list endpoint is by category.
        // Let's add a quick GET to /api/mail/action?id=... or just /api/mail/message/[id]
        // Wait, I didn't create a single message endpoint.
        // I'll create `app/api/mail/message/[id]/route.ts` quickly or just use `action` to fetch? No action is POST.
        // Let's create `app/api/mail/message/[id]/route.ts` now.
        const res = await fetch(`/api/mail/message/${mailId}`);
        const data = await res.json();
        if (data.mail) {
          setMail(data.mail);
          // Mark as read if not read
          if (!data.mail.is_read) {
            await fetch("/api/mail/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: mailId, action: "read", value: true }),
            });
            onAction(); // Refresh list to update read status
          }
        }
      } catch (error) {
        console.error("Failed to fetch mail", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMail();
  }, [mailId, onAction]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      await fetch("/api/mail/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mailId, action: "trash" }),
      });
      onAction();
      onBack();
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!mail) return <div className="p-8 text-center">Mail not found</div>;

  return (
    <div className="h-full flex flex-col bg-[#0E0E10]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 pl-0 hover:bg-transparent hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-white mb-6">{mail.subject}</h1>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {mail.from?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-white">{mail.from}</div>
              <div className="text-sm text-gray-400">to {mail.to}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(mail.timestamp), "PPP p")}
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: mail.body || "" }} />
        </div>
      </div>
    </div>
  );
}
