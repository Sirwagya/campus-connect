"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Hash,
  Send,
  Users,
  MoreVertical,
  Loader2,
  LogOut,
  Trash2,
  Settings,
} from "lucide-react";
import { Space, SpaceMember, SpaceMessage } from "@/types/spaces";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface SpaceChatClientProps {
  space: Space;
  initialMember: SpaceMember | null;
  currentUser: any;
}

export function SpaceChatClient({
  space,
  initialMember,
  currentUser,
}: SpaceChatClientProps) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [member, setMember] = useState<SpaceMember | null>(initialMember);
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Members Modal State
  const [showMembers, setShowMembers] = useState(false);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inviteSearch.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/users/search?q=${encodeURIComponent(inviteSearch)}`
          );
          const data = await res.json();
          if (data.users) {
            setSearchResults(data.users);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inviteSearch]);

  // Join Space
  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/spaces/${space.slug}/join`, {
        method: "POST",
      });
      if (res.ok) {
        setMember({
          id: "temp", // Will be refreshed
          space_id: space.id,
          user_id: currentUser.id,
          role: "member",
          joined_at: new Date().toISOString(),
        });
        router.refresh();
      } else {
        alert("Failed to join space");
      }
    } catch (error) {
      console.error("Error joining space:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Messages
  useEffect(() => {
    if (!member) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/spaces/${space.slug}/messages`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [space.slug, member]);

  // Fetch Members List
  useEffect(() => {
    if (showMembers && space.id) {
      const fetchMembers = async () => {
        setLoadingMembers(true);
        const { data, error } = await supabase
          .from("space_members")
          .select(
            `
            *,
            user:users(id, name, full_name, avatar_url)
          `
          )
          .eq("space_id", space.id);

        if (!error && data) {
          setMembersList(data);
        }
        setLoadingMembers(false);
      };
      fetchMembers();
    }
  }, [showMembers, space.id, supabase]);

  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Realtime Subscription
  useEffect(() => {
    if (!member) return;

    const channel = supabase
      .channel(`space:${space.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "space_messages",
          filter: `space_id=eq.${space.id}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as SpaceMessage;
          // Fetch author details (since realtime payload doesn't have relations)
          const { data: author } = await supabase
            .from("users")
            .select("id, name, full_name, avatar_url")
            .eq("id", newMsg.author_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, author: author || undefined, reactions: [] },
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "space_message_reactions",
        },
        async () => {
          // Simplest approach for MVP: Refetch all messages to get updated reaction counts
          const res = await fetch(`/api/spaces/${space.slug}/messages`);
          const data = await res.json();
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: currentUser.id,
            name: currentUser.name,
            avatar_url: currentUser.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id, member, supabase, space.slug, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/spaces/${space.slug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Leave Space
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this space?")) return;
    try {
      const { error } = await supabase
        .from("space_members")
        .delete()
        .eq("space_id", space.id)
        .eq("user_id", currentUser.id);

      if (error) throw error;
      router.refresh();
      setMember(null);
    } catch (error) {
      console.error("Error leaving space:", error);
      alert("Failed to leave space");
    }
  };

  // Delete Space (Owner Only)
  const handleDeleteSpace = async () => {
    const confirmName = prompt(
      `To delete this space, type "${space.name}" to confirm:`
    );
    if (confirmName !== space.name) return;

    try {
      const { error } = await supabase
        .from("spaces")
        .delete()
        .eq("id", space.id);

      if (error) throw error;
      router.push("/spaces");
    } catch (error) {
      console.error("Error deleting space:", error);
      alert("Failed to delete space");
    }
  };

  // Toggle Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Optimistic update (optional, skipping for simplicity in MVP)
      await fetch(`/api/spaces/${space.slug}/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <Hash className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Join {space.name}</h1>
        <p className="text-muted-foreground max-w-md text-center">
          {space.description ||
            "Join this space to start chatting with the community."}
        </p>
        <Button onClick={handleJoin} disabled={isLoading} size="lg">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Join Space
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="font-bold text-lg leading-none">{space.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {space.member_count} members
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Invite Button (Private Spaces & Owner/Mod only) */}
          {space.is_private &&
            (member?.role === "owner" || member?.role === "moderator") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowInvite(true)}
              >
                <Users className="h-4 w-4" />
                Invite
              </Button>
            )}

          <Button
            variant="ghost"
            size="icon"
            title="View Members"
            onClick={() => setShowMembers(true)}
          >
            <Users className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleLeave}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Leave Space</span>
              </DropdownMenuItem>
              {member?.role === "owner" && (
                <>
                  <div className="h-px bg-border my-1" />
                  <DropdownMenuItem
                    onClick={handleDeleteSpace}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Space</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Members Modal */}
      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title={`Members (${membersList.length})`}
      >
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          {loadingMembers ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            membersList.map((m) => {
              const isOnline = onlineUsers.some((u: any) => u.id === m.user_id);
              return (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={m.user?.avatar_url}
                          alt={m.user?.name || "User"}
                        />
                        <AvatarFallback>
                          {m.user?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {m.user?.name || "Unknown User"}
                        {m.user_id === currentUser.id && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {space.is_private &&
          (member?.role === "owner" || member?.role === "moderator") && (
            <div className="mt-4 pt-4 border-t">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setShowMembers(false);
                  setShowInvite(true);
                }}
              >
                Invite members
              </Button>
            </div>
          )}
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={showInvite}
        onClose={() => {
          setShowInvite(false);
          setInviteSearch("");
          setSearchResults([]);
          setSelectedUser(null);
        }}
        title="Invite User"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for a user to invite to <strong>{space.name}</strong>.
          </p>

          <div className="relative">
            <Input
              placeholder="Search by name..."
              value={inviteSearch}
              onChange={(e) => {
                setInviteSearch(e.target.value);
                setSelectedUser(null); // Clear selection on type
              }}
              className={cn(
                selectedUser && "border-green-500 ring-1 ring-green-500"
              )}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Search Results Dropdown */}
            {!selectedUser && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left transition-colors"
                    onClick={() => {
                      setSelectedUser(user);
                      setInviteSearch(user.name || user.full_name);
                      setSearchResults([]);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.name || user.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={selectedUser.avatar_url}
                  alt={selectedUser.name}
                />
                <AvatarFallback>{selectedUser.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Selected: {selectedUser.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUser(null);
                  setInviteSearch("");
                }}
              >
                Change
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                setInviting(true);
                try {
                  // We can pass the email if we have it, or just pass the name/id and let backend handle it.
                  // Since our backend currently expects 'email' but falls back to name lookup,
                  // and we want to be robust, let's update the backend to accept userId or just pass the name as email for now if backend supports it.
                  // Actually, better to pass the exact name we found.
                  const res = await fetch(
                    `/api/spaces/${space.slug}/invite-user`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: selectedUser.name }), // Backend falls back to name lookup
                    }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    alert("Invite sent successfully!");
                    setShowInvite(false);
                    setInviteSearch("");
                    setSelectedUser(null);
                  } else {
                    alert(data.error || "Failed to send invite");
                  }
                } catch (error) {
                  console.error(error);
                  alert("Error sending invite");
                } finally {
                  setInviting(false);
                }
              }}
              disabled={inviting || !selectedUser}
            >
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.author_id === currentUser.id;
            const showHeader =
              i === 0 || messages[i - 1].author_id !== msg.author_id;

            // Group reactions
            const reactionCounts: Record<
              string,
              { count: number; hasReacted: boolean }
            > = {};
            msg.reactions?.forEach((r) => {
              if (!reactionCounts[r.emoji]) {
                reactionCounts[r.emoji] = { count: 0, hasReacted: false };
              }
              reactionCounts[r.emoji].count++;
              if (r.user_id === currentUser.id) {
                reactionCounts[r.emoji].hasReacted = true;
              }
            });

            return (
              <div
                key={msg.id}
                className={cn("flex gap-3 group", showHeader ? "mt-4" : "mt-1")}
              >
                {showHeader ? (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage
                      src={msg.author?.avatar_url}
                      alt={msg.author?.name || "User"}
                    />
                    <AvatarFallback>
                      {msg.author?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8" />
                )}
                <div className="flex-1 min-w-0">
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm hover:underline cursor-pointer">
                        {msg.author?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="relative group/msg">
                    {msg.is_deleted ? (
                      <p className="text-sm text-muted-foreground italic">
                        This message has been deleted.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                          {msg.content}
                          {msg.is_edited && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              (edited)
                            </span>
                          )}
                        </p>

                        {/* Reaction Bar (visible on hover) */}
                        <div className="absolute -top-4 right-0 opacity-0 group-hover/msg:opacity-100 transition-opacity bg-background border rounded-full shadow-sm flex items-center gap-0.5 p-0.5 z-10">
                          {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className="hover:bg-accent p-1 rounded-full text-sm leading-none"
                            >
                              {emoji}
                            </button>
                          ))}

                          {/* Message Actions (Edit/Delete) */}
                          {isMe && (
                            <>
                              <div className="w-px h-3 bg-border mx-1" />
                              <button
                                onClick={() => {
                                  const newContent = prompt(
                                    "Edit message:",
                                    msg.content
                                  );
                                  if (
                                    newContent &&
                                    newContent !== msg.content
                                  ) {
                                    // Simple prompt for MVP. Ideally inline edit.
                                    fetch(
                                      `/api/spaces/${space.slug}/messages/${msg.id}`,
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          content: newContent,
                                        }),
                                      }
                                    );
                                  }
                                }}
                                className="hover:bg-accent p-1 rounded-full text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this message?"
                                    )
                                  ) {
                                    fetch(
                                      `/api/spaces/${space.slug}/messages/${msg.id}`,
                                      {
                                        method: "DELETE",
                                      }
                                    );
                                  }
                                }}
                                className="hover:bg-accent p-1 rounded-full text-muted-foreground hover:text-red-500"
                                title="Delete"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(reactionCounts).map(
                        ([emoji, { count, hasReacted }]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                              hasReacted
                                ? "bg-primary/10 border-primary/50 text-primary"
                                : "bg-secondary/50 border-transparent hover:bg-secondary"
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium">{count}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${space.name}`}
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
