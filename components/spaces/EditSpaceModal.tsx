"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MessageSquare, Loader2, Hash, Lock, Globe } from "lucide-react";
import { Space } from "@/types/spaces";

interface EditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
}

export function EditSpaceModal({
  isOpen,
  onClose,
  space,
}: EditSpaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || "");
  const [isPrivate, setIsPrivate] = useState(space.is_private);
  const [tags, setTags] = useState(space.tags?.join(", ") || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(space.name);
      setDescription(space.description || "");
      setIsPrivate(space.is_private);
      setTags(space.tags?.join(", ") || "");
    }
  }, [isOpen, space]);

  const handleUpdateSpace = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/spaces/${space.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          is_private: isPrivate,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update space");
      }

      // Refresh the page to show changes
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error("Error updating space:", error);
      alert(error.message || "Failed to update space");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Space">
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
            {isPrivate ? "Only invited members can join." : "Anyone can join."}
          </span>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateSpace}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
