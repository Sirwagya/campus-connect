"use client";

import { useState, useEffect } from "react";
import { Mail, MailCategory } from "@/types/mail";
import { MailItem } from "./MailItem";
import { Skeleton } from "@/components/ui/Skeleton";

interface MailListProps {
  category: MailCategory;
  onSelectMail: (id: string) => void;
  refreshTrigger: number;
}

export function MailList({
  category,
  onSelectMail,
  refreshTrigger,
}: MailListProps) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/mail/${category}`);
        const data = await res.json();
        if (data.mails) {
          setMails(data.mails);
        }
      } catch (error) {
        console.error("Failed to fetch mails", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMails();
  }, [category, refreshTrigger]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border border-white/5 rounded-lg"
          >
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (mails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No mails in {category}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {mails.map((mail) => (
        <MailItem
          key={mail.id}
          mail={mail}
          onClick={() => onSelectMail(mail.id)}
        />
      ))}
    </div>
  );
}
