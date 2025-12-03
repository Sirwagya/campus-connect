"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeedUser, FeedAttachment, FeedPost } from "@/types/feed";

interface ComposerProps {
  user: FeedUser;
  onPostCreated: (post: FeedPost) => void;
}

export function Composer({ user, onPostCreated }: ComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<FeedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large (max 5MB)");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/feed/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = (await res.json()) as FeedAttachment;
        setAttachments((prev) => [...prev, data]);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload image");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistic post object
    const optimisticPost: FeedPost = {
      id: `temp-${Date.now()}`,
      body: content.trim(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      user: {
        id: user.id,
        name: user.name || user.email?.split("@")[0],
        avatar_url: user.avatar_url,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      attachments,
      liked_by_user: false,
      likes_count: 0,
      comments_count: 0,
      isOptimistic: true,
    };

    // Notify parent immediately
    onPostCreated(optimisticPost);

    try {
      const res = await fetch("/api/feed/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          attachments: attachments,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post");
      }

      await res.json();

      // Reset form
      setContent("");
      setAttachments([]);
      setIsFocused(false);
    } catch (error) {
      console.error("Post error:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl glass-panel p-5 transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-white/10">
      <div className="flex gap-4">
        <Avatar className="h-11 w-11 border border-white/10 shadow-sm">
          <AvatarImage
            src={user.avatar_url ?? undefined}
            alt={user.name || "User"}
          />
          <AvatarFallback>
            {user.name?.[0] || user.email?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="min-h-[80px] border-none bg-transparent resize-none p-0 focus-visible:ring-0 text-lg placeholder:text-gray-500 text-white leading-relaxed"
          />

          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              >
                {attachments.map((att, i) => (
                  <div key={att.url} className="relative group shrink-0">
                    <Image
                      src={att.url}
                      alt={att.name || "Attachment"}
                      width={320}
                      height={160}
                      sizes="160px"
                      className="h-40 w-auto rounded-xl object-cover border border-white/10 shadow-md"
                      unoptimized
                    />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 backdrop-blur-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "flex items-center justify-between pt-3 border-t border-white/5 transition-opacity duration-200",
              !isFocused && !content && attachments.length === 0
                ? "opacity-60"
                : "opacity-100"
            )}
          >
            <div className="flex gap-1">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-[#a970ff] hover:text-[#a970ff] hover:bg-[#a970ff]/10 h-9 w-9 rounded-full transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={
                (!content.trim() && attachments.length === 0) ||
                isSubmitting ||
                isUploading
              }
              className="rounded-full px-6 font-bold bg-[#a970ff] hover:bg-[#9455f5] text-white h-9 shadow-lg shadow-[#a970ff]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              size="sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Post <Send className="ml-2 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
