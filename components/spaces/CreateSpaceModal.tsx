"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MessageSquare, Loader2, Hash, Lock, Globe } from "lucide-react";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  }, [name]);

  const handleCreateSpace = async () => {
    if (!name.trim() || !slug.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          isPrivate,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create space");
      }

      // Redirect to the new space
      router.push(`/spaces/${data.space.slug}`);
      onClose();
    } catch (error: any) {
      console.error("Error creating space:", error);
      alert(error.message || "Failed to create space");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Space">
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Space Name</label>
          <Input
            placeholder="e.g. Web Development"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-semibold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug (URL)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
              /spaces/
            </span>
            <Input
              placeholder="web-development"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="pl-[4.5rem] font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="What is this space about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none h-20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="coding, react, help"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
              isPrivate
                ? "bg-primary/10 border-primary text-primary"
                : "bg-background border-input hover:bg-accent"
            }`}
          >
            {isPrivate ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isPrivate ? "Private Space" : "Public Space"}
            </span>
          </button>
          <span className="text-xs text-muted-foreground">
            {isPrivate
              ? "Only invited members can join and view messages."
              : "Anyone can join and view messages."}
          </span>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSpace}
            disabled={!name.trim() || !slug.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Create Space
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
