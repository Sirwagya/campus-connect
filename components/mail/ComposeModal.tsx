"use client";

import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function ComposeModal({ isOpen, onClose, onSent }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);

  // Auto-save draft
  useEffect(() => {
    const saveDraft = async () => {
      if ((!to && !subject && !body) || sending) return;

      try {
        const res = await fetch("/api/mail/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body, id: draftId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.id) setDraftId(data.id);
        }
      } catch (error) {
        console.error("Failed to save draft", error);
      }
    };

    const timeout = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timeout);
  }, [to, subject, body, draftId, sending]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });

      if (res.ok) {
        onSent();
        onClose();
      } else {
        console.error("Failed to send");
        alert("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email", error);
      alert("Error sending email");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 right-20 w-[500px] bg-[#18181B] border border-white/10 rounded-t-lg shadow-2xl flex flex-col transition-all duration-200 z-50",
        isMinimized ? "h-12" : "h-[600px]"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#27272a] rounded-t-lg cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span className="font-medium text-white">New Message</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="text-gray-400 hover:text-white"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col p-4 gap-4">
          <Input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-transparent border-b border-white/10 rounded-none px-0 focus-visible:ring-0"
          />
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-transparent border-b border-white/10 rounded-none px-0 focus-visible:ring-0"
          />
          <textarea
            placeholder="Type your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 bg-transparent resize-none focus:outline-none text-white placeholder:text-gray-500"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={sending || !to || !body}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
