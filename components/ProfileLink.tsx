"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ProfileClickable } from "@/components/profile";
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

/**
 * ProfileLink - Clickable user element that opens mini profile
 *
 * Use this anywhere you want to display a clickable user avatar/name.
 * Clicking opens the mini profile popup instead of navigating.
 */
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
    <ProfileClickable
      userId={userId}
      className={cn(
        "inline-flex items-center gap-2 font-medium hover:text-primary transition-colors",
        className
      )}
    >
      <span
        className="inline-flex items-center gap-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
      </span>
    </ProfileClickable>
  );
}
