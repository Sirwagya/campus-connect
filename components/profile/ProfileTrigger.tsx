"use client";

import { useState, useCallback, MouseEvent, ReactNode } from "react";
import { MiniProfileCard } from "./MiniProfileCard";
import { FullProfileModal } from "./FullProfileModal";

interface ProfileTriggerProps {
  userId: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * ProfileTrigger - Wrapper component for usernames, avatars, etc.
 *
 * Clicking opens a mini profile popup anchored to the click position.
 * From the mini popup, users can view the full profile modal.
 *
 * Usage:
 * ```tsx
 * <ProfileTrigger userId={user.id}>
 *   <Avatar>...</Avatar>
 * </ProfileTrigger>
 * ```
 */
export function ProfileTrigger({
  userId,
  children,
  className = "",
  disabled = false,
}: ProfileTriggerProps) {
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      // Get the bounding rect of the clicked element
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      setAnchorRect(rect);
      setShowMiniProfile(true);
    },
    [disabled]
  );

  const handleCloseMiniProfile = useCallback(() => {
    setShowMiniProfile(false);
    setAnchorRect(null);
  }, []);

  const handleViewFullProfile = useCallback(() => {
    setShowMiniProfile(false);
    setShowFullProfile(true);
  }, []);

  const handleCloseFullProfile = useCallback(() => {
    setShowFullProfile(false);
    setAnchorRect(null);
  }, []);

  return (
    <>
      <span
        onClick={handleClick}
        className={`cursor-pointer inline-block ${className}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick(e as any);
          }
        }}
      >
        {children}
      </span>

      {/* Mini Profile Card */}
      {showMiniProfile && anchorRect && (
        <MiniProfileCard
          userId={userId}
          anchorRect={anchorRect}
          onClose={handleCloseMiniProfile}
          onViewFullProfile={handleViewFullProfile}
        />
      )}

      {/* Full Profile Modal */}
      <FullProfileModal
        userId={userId}
        isOpen={showFullProfile}
        onClose={handleCloseFullProfile}
        initialPosition={
          anchorRect ? { x: anchorRect.x, y: anchorRect.y } : undefined
        }
      />
    </>
  );
}
