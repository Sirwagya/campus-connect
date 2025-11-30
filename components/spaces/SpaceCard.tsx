"use client";

import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
  Users,
  Lock,
  Hash,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Space } from "@/types/spaces";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { EditSpaceModal } from "./EditSpaceModal";

interface SpaceCardProps {
  space: Space;
  isAdmin?: boolean;
  onDelete?: () => void;
}

export function SpaceCard({ space, isAdmin, onDelete }: SpaceCardProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to delete "${space.name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/spaces/${space.slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onDelete) {
          onDelete();
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete space");
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      alert("Error deleting space");
    }
  };

  return (
    <>
      <Card
        className="p-4 cursor-pointer hover:bg-accent/5 transition-colors border-l-4 border-l-primary flex flex-col h-full"
        onClick={() => router.push(`/spaces/${space.slug}`)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {space.is_private && (
              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {space.member_count} members
            </span>
          </div>

          {isAdmin && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Space
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    handleDelete(e as any);
                  }}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Space
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          {space.name}
        </h3>

        {space.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {space.description}
          </p>
        )}

        <div className="mt-auto space-y-3">
          {space.tags && space.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {space.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary/50 px-2 py-1 rounded-md text-secondary-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Created {new Date(space.created_at).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1 text-primary text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Join Chat
            </div>
          </div>
        </div>
      </Card>

      <EditSpaceModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        space={space}
      />
    </>
  );
}
