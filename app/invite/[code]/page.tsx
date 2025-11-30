"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, Hash, Users } from "lucide-react";

export default function InvitePage() {
  const { code } = useParams();
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${code}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invite");
        setInvite(data.invite);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/${code}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");

      // Redirect to space
      router.push(`/spaces/${data.spaceSlug}`);
    } catch (err: any) {
      setError(err.message);
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-500">
          <Hash className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Invalid Invite</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/spaces")}>Go to Spaces</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-4 text-center bg-background">
      <div className="rounded-full bg-primary/10 p-6">
        <Hash className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          You've been invited to join
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          {invite.space.name}
        </h1>
      </div>

      {invite.space.description && (
        <p className="max-w-md text-muted-foreground text-lg">
          {invite.space.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
        <Users className="h-4 w-4" />
        <span>{invite.space.member_count} members</span>
        <span>•</span>
        <span>{invite.space.is_private ? "Private" : "Public"} Group</span>
      </div>

      <Button
        size="lg"
        className="mt-4 min-w-[200px]"
        onClick={handleJoin}
        disabled={joining}
      >
        {joining ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Accept Invite"
        )}
      </Button>
    </div>
  );
}
