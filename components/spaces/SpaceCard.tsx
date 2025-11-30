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
  Globe,
  ArrowRight,
} from "lucide-react";
import { Space } from "@/types/spaces";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { EditSpaceModal } from "./EditSpaceModal";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

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

  // Generate a deterministic gradient based on the space name
  const getGradient = (name: string) => {
    const colors = [
      "from-purple-900/80 to-blue-900/80",
      "from-pink-900/80 to-rose-900/80",
      "from-emerald-900/80 to-teal-900/80",
      "from-orange-900/80 to-amber-900/80",
      "from-indigo-900/80 to-violet-900/80",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full"
      >
        <Card
          className="group relative overflow-hidden cursor-pointer bg-[#131313] border-[#1f1f1f] hover:border-primary/30 transition-all h-full flex flex-col shadow-lg hover:shadow-[0_0_20px_rgba(155,92,255,0.1)]"
          onClick={() => router.push(`/spaces/${space.slug}`)}
        >
          {/* Banner Area */}
          <div
            className={cn(
              "h-32 w-full bg-gradient-to-br relative",
              getGradient(space.name)
            )}
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {space.is_private ? (
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-md text-amber-400 border-none"
                >
                  <Lock className="h-3 w-3 mr-1" /> Private
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-md text-[#38ffb0] border-none"
                >
                  <Globe className="h-3 w-3 mr-1" /> Public
                </Badge>
              )}
            </div>

            {isAdmin && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#18181B] border-[#1f1f1f] text-white"
                    >
                      <DropdownMenuItem
                        onClick={() => setShowEdit(true)}
                        className="hover:bg-white/10 cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Space
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(e as any)}
                        className="text-red-500 focus:text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Space
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col relative">
            {/* Space Icon/Avatar */}
            <div className="absolute -top-10 left-5">
              <div className="h-20 w-20 rounded-2xl bg-[#18181B] border-4 border-[#131313] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                <span className="text-3xl font-bold text-primary">#</span>
              </div>
            </div>

            <div className="mt-10 mb-2">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {space.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {space.member_count} members
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Active
                </span>
              </div>
            </div>

            {space.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-6 flex-1">
                {space.description}
              </p>
            )}

            <div className="mt-auto pt-4 border-t border-[#1f1f1f] flex items-center justify-between">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full bg-[#27272a] border-2 border-[#131313] flex items-center justify-center text-[10px] text-gray-500"
                  >
                    ?
                  </div>
                ))}
                {space.member_count > 3 && (
                  <div className="h-7 w-7 rounded-full bg-[#27272a] border-2 border-[#131313] flex items-center justify-center text-[10px] text-gray-400 font-medium">
                    +{space.member_count - 3}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-none h-9 px-5 font-medium shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all"
              >
                Join Space <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <EditSpaceModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        space={space}
      />
    </>
  );
}
