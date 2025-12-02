'use client';

import { Button } from '@/components/ui/Button';
import { useFollowStatus, usePresence } from '@/hooks/use-realtime';
import { UserPlus, UserMinus, Users, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'default' | 'lg';
  showCounts?: boolean;
  className?: string;
}

export function FollowButton({
  targetUserId,
  size = 'default',
  showCounts = false,
  className,
}: FollowButtonProps) {
  const { status, isLoading, follow, unfollow } = useFollowStatus(targetUserId);
  const { presence } = usePresence(targetUserId);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      if (status?.isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        disabled
        size={size}
        className={cn('rounded-full', className)}
        variant="outline"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const isFollowing = status?.isFollowing ?? false;
  const followerCount = status?.followerCount ?? 0;
  const followingCount = status?.followingCount ?? 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleClick}
        disabled={isUpdating}
        size={size}
        className={cn(
          'rounded-full transition-all duration-200',
          isFollowing
            ? 'bg-white/10 hover:bg-red-500/20 text-white border border-white/30 hover:border-red-500/50 hover:text-red-400'
            : 'bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold shadow-[0_0_20px_rgba(30,215,96,0.3)] hover:scale-105',
          className
        )}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isFollowing ? (
          <UserMinus className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
        {presence?.status === 'online' && (
          <span className="ml-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </Button>

      {showCounts && (
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-white">{followerCount}</span>
            {followerCount === 1 ? 'Follower' : 'Followers'}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>
            <span className="font-medium text-white">{followingCount}</span>
            {' Following'}
          </span>
        </div>
      )}
    </div>
  );
}

// Presence indicator for avatars
interface PresenceIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PresenceIndicator({ userId, size = 'md', className }: PresenceIndicatorProps) {
  const { presence, isLoading } = usePresence(userId);

  if (isLoading || !presence || presence.status === 'offline') {
    return null;
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  return (
    <span
      className={cn(
        'absolute rounded-full ring-2 ring-[#121212]',
        sizeClasses[size],
        statusColors[presence.status],
        presence.status === 'online' && 'animate-pulse',
        className
      )}
      title={presence.customStatus || presence.status}
    />
  );
}
