"use client";

import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ComposerProps {
  user: {
    id: string;
    name?: string;
    avatar_url?: string;
    email?: string;
  };
  onPostCreated: (post: any) => void;
}

export function Composer({ user, onPostCreated }: ComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

        const data = await res.json();
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
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      user: {
        id: user.id,
        name: user.name || user.email?.split("@")[0],
        avatar_url: user.avatar_url,
      },
      likes_count: 0,
      comments_count: 0,
      attachments: attachments,
      liked_by_user: false,
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

      const { post } = await res.json();

      // We could replace the optimistic post here, but for now we'll rely on the
      // parent to handle the real data coming back or a re-fetch.
      // Ideally, onPostCreated would handle replacing the temp ID.

      // Reset form
      setContent("");
      setAttachments([]);
    } catch (error) {
      console.error("Post error:", error);
      alert("Failed to create post. Please try again.");
      // In a real app, we'd revert the optimistic update here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b p-4 bg-background">
      <div className="flex gap-4">
        <Avatar
          src={user.avatar_url}
          fallback={user.name?.[0] || user.email?.[0]}
        />
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] border-none resize-none p-0 focus-visible:ring-0 text-lg"
          />

          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  <img
                    src={att.url}
                    alt="Attachment"
                    className="h-32 w-auto rounded-lg object-cover border"
                  />
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
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
                className="text-primary"
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
              className="rounded-full px-6 font-bold"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
