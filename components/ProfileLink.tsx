"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProfileLinkProps {
  userId: string;
  displayName?: string;
  avatarUrl?: string | null;
  className?: string;
  showAvatar?: boolean;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export function ProfileLink({
  userId,
  displayName,
  avatarUrl,
  className,
  showAvatar = true,
  size = "sm",
  children,
}: ProfileLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <Link
      href={`/profile/${userId}`}
      className={cn(
        "inline-flex items-center gap-2 font-medium hover:text-primary transition-colors",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()} // Prevent bubbling if inside a clickable card
    >
      {showAvatar && (
        <Avatar className={cn(sizeClasses[size], "border border-white/10")}>
          <AvatarImage
            src={avatarUrl || undefined}
            alt={displayName || "User"}
          />
          <AvatarFallback className="text-[10px]">
            {(displayName || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {children || (
        <span className={cn(isHovered && "underline decoration-primary/50")}>
          {displayName || "Unknown User"}
        </span>
      )}
    </Link>
  );
}
