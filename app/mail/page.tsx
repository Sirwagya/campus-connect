"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MailList } from "@/components/mail/MailList";
import { MailView } from "@/components/mail/MailView";
import { ComposeModal } from "@/components/mail/ComposeModal";
import { Button } from "@/components/ui/Button";
import { Plus, RefreshCw } from "lucide-react";
import { MailCategory } from "@/types/mail";

export default function MailPage() {
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") as MailCategory) || "inbox";
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0E0E10]">
        <h1 className="text-xl font-bold capitalize">{category}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {selectedMailId ? (
          <MailView
            mailId={selectedMailId}
            onBack={() => setSelectedMailId(null)}
            onAction={handleRefresh}
          />
        ) : (
          <MailList
            category={category}
            onSelectMail={setSelectedMailId}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onSent={handleRefresh}
        />
      )}
    </div>
  );
}
