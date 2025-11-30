"use client";

import { Button } from "@/components/ui/Button";
import { Loader2, Check, X, Ticket } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventRegistrationButtonProps {
  eventId: string;
  isRegistered: boolean;
  isFull: boolean;
}

export function EventRegistrationButton({
  eventId,
  isRegistered,
  isFull,
}: EventRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participationType: "solo",
          formData: {},
        }),
      });

      // Only try to parse JSON if we have a response body
      let data = null;
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
      }

      if (res.ok) {
        router.refresh();
      } else {
        alert(data?.error || "Failed to register");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Are you sure you want to unregister?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to unregister");
      }
    } catch (error) {
      console.error("Unregistration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 text-lg font-medium border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        onClick={handleUnregister}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Check className="mr-2 h-5 w-5" />
        )}
        Registered
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button
        disabled
        variant="secondary"
        className="w-full h-12 text-lg font-medium bg-[#27272a] text-muted-foreground cursor-not-allowed"
      >
        Registration Closed
      </Button>
    );
  }

  return (
    <Button
      className={cn(
        "w-full h-14 text-lg font-bold tracking-wide",
        "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]",
        "hover:from-[#7c3aed] hover:to-[#9333ea]",
        "shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]",
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        "border-none text-white"
      )}
      onClick={handleRegister}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Ticket className="mr-2 h-5 w-5" />
      )}
      Register Now
    </Button>
  );
}
