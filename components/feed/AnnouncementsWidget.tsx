"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Pencil, Trash2, Plus, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AnnouncementsWidgetProps {
  maxItems?: number;
}

export function AnnouncementsWidget({
  maxItems = 3,
}: AnnouncementsWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/announcements?limit=${maxItems}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { data } = await res.json();
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const { data } = await res.json();
      setAnnouncements((prev) => [data, ...prev].slice(0, maxItems));
      setNewContent("");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create announcement:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnnouncement?.id === id) setSelectedAnnouncement(null);
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  const getTitle = (content: string | undefined | null) => {
    if (!content) return "Announcement";
    const firstLine = content.split("\n")[0];
    return firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
  };

  const getPreview = (content: string | undefined | null) => {
    if (!content) return "";
    const lines = content.split("\n").slice(1).join(" ").trim();
    return lines.length > 80 ? lines.slice(0, 80) + "..." : lines;
  };

  return (
    <>
      <div
        className="bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-white">Announcements</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsCreating(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-primary transition-colors"
              title="New Announcement"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 min-h-[100px]">
          {loading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02]">
                  <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center h-20 text-center">
              <p className="text-sm text-white/40 mb-2">{error}</p>
              <button
                onClick={fetchAnnouncements}
                className="text-xs text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : announcements.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-20 text-center">
              <Megaphone className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">No announcements</p>
            </div>
          ) : (
            // Announcement list
            <div className="space-y-2">
              {announcements.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedAnnouncement(item)}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {getTitle(item.content)}
                      </p>
                      {getPreview(item.content) && (
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {getPreview(item.content)}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/30">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Announcement Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d0d12] rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-white">
                    Announcement
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedAnnouncement.user?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {selectedAnnouncement.user?.full_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedAnnouncement.user?.full_name || "Admin"}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatDistanceToNow(
                        new Date(selectedAnnouncement.created_at),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d0d12] rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  New Announcement
                </h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your announcement..."
                  className="w-full h-32 px-4 py-3 bg-white/5 rounded-xl text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsCreating(false)}
                    className="text-white/60"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newContent.trim() || saving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {saving ? "Posting..." : "Post Announcement"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
