"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Plus, Search } from "lucide-react";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import { Space } from "@/types/spaces";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

interface SpacesListProps {
  initialSpaces: Space[];
  isAdmin?: boolean;
}

export function SpacesList({ initialSpaces, isAdmin }: SpacesListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleDeleteSpace = (spaceId: string) => {
    setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
  };

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#1f1f1f]">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Community Spaces
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Join discussions, find your squad, and collaborate on projects.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
            <Input
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`pl-10 bg-[#131313] border-[#1f1f1f] text-white h-11 transition-all duration-300 ${
                isSearchFocused
                  ? "w-full md:w-[300px] ring-1 ring-primary border-primary"
                  : "w-full md:w-[240px] hover:border-white/20"
              }`}
            />
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(155,92,255,0.3)] hover:shadow-[0_0_30px_rgba(155,92,255,0.5)] transition-all duration-300 hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Space
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredSpaces.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 border border-dashed border-[#1f1f1f] rounded-3xl bg-gradient-to-b from-[#131313] to-transparent">
            <div className="bg-[#18181B] p-6 rounded-full mb-6 shadow-xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No spaces found
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md text-center text-lg">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : "Be the first to create a community space and start the conversation!"}
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="border-[#1f1f1f] text-white hover:bg-[#1f1f1f] hover:text-primary h-12 px-8"
            >
              Create New Space
            </Button>
          </div>
        ) : (
          filteredSpaces.map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="h-full"
            >
              <SpaceCard
                space={space}
                isAdmin={isAdmin}
                onDelete={() => handleDeleteSpace(space.id)}
              />
            </motion.div>
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
