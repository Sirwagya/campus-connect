"use client";

import { Button } from "@/components/ui/Button";
import { Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        alert(data.error || "Failed to register");
      }
    } catch (error) {
      console.error("Registration error:", error);
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
        className="w-full sm:w-auto border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
        onClick={handleUnregister}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Registered
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button disabled variant="secondary" className="w-full sm:w-auto">
        Event Full
      </Button>
    );
  }

  return (
    <Button
      className="w-full sm:w-auto"
      onClick={handleRegister}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Register Now
    </Button>
  );
}
