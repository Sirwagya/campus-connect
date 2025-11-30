"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Plus } from "lucide-react";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import { Space } from "@/types/spaces";

interface SpacesListProps {
  initialSpaces: Space[];
  isAdmin?: boolean;
}

export function SpacesList({ initialSpaces, isAdmin }: SpacesListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);

  const handleDeleteSpace = (spaceId: string) => {
    setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Community Spaces
          </h1>
          <p className="text-muted-foreground">
            Join group chats, clubs, and discussions.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Space
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {spaces.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
            <div className="bg-muted/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No spaces found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a community space!
            </p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Create Space
            </Button>
          </div>
        ) : (
          spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              isAdmin={isAdmin}
              onDelete={() => handleDeleteSpace(space.id)}
            />
          ))
        )}
      </div>

      <CreateSpaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
