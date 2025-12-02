'use client';

import { useReactions } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Smile, ThumbsUp, Heart, PartyPopper, HandHeart, Lightbulb, Laugh } from 'lucide-react';

type Emoji = 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'funny';

interface ReactionButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  compact?: boolean;
  className?: string;
}

const EMOJI_CONFIG: Record<Emoji, { icon: React.ElementType; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-blue-400 bg-blue-400/10' },
  love: { icon: Heart, label: 'Love', color: 'text-red-400 bg-red-400/10' },
  celebrate: { icon: PartyPopper, label: 'Celebrate', color: 'text-yellow-400 bg-yellow-400/10' },
  support: { icon: HandHeart, label: 'Support', color: 'text-green-400 bg-green-400/10' },
  insightful: { icon: Lightbulb, label: 'Insightful', color: 'text-purple-400 bg-purple-400/10' },
  funny: { icon: Laugh, label: 'Funny', color: 'text-orange-400 bg-orange-400/10' },
};

export function ReactionButton({ targetType, targetId, compact = false, className }: ReactionButtonProps) {
  const { reactions, myReaction, isLoading, react } = useReactions(targetType, targetId);
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<Emoji, number>);

  const totalReactions = reactions.length;
  const hasReactions = totalReactions > 0;

  const handleReact = async (emoji: Emoji) => {
    await react(emoji);
    setShowPicker(false);
  };

  if (isLoading) {
    return (
      <div className={cn('h-8 w-16 bg-white/5 rounded-full animate-pulse', className)} />
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        onBlur={() => setTimeout(() => setShowPicker(false), 200)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
          'hover:bg-white/10 active:scale-95',
          myReaction 
            ? EMOJI_CONFIG[myReaction].color
            : 'text-white/60 hover:text-white'
        )}
      >
        {myReaction ? (
          <>
            {(() => {
              const Icon = EMOJI_CONFIG[myReaction].icon;
              return <Icon className="h-4 w-4" />;
            })()}
            {!compact && <span className="text-sm">{EMOJI_CONFIG[myReaction].label}</span>}
          </>
        ) : (
          <>
            <Smile className="h-4 w-4" />
            {!compact && <span className="text-sm">React</span>}
          </>
        )}
        {hasReactions && (
          <span className="text-xs font-medium">{totalReactions}</span>
        )}
      </button>

      {/* Emoji picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-[#282828] rounded-full p-1.5 shadow-xl border border-white/10 flex gap-1">
            {(Object.entries(EMOJI_CONFIG) as [Emoji, typeof EMOJI_CONFIG[Emoji]][]).map(([emoji, config]) => {
              const Icon = config.icon;
              const count = reactionCounts[emoji] || 0;
              const isSelected = myReaction === emoji;
              
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={cn(
                    'relative p-2 rounded-full transition-all hover:scale-125',
                    'hover:bg-white/10',
                    isSelected && config.color
                  )}
                  title={config.label}
                >
                  <Icon className={cn('h-5 w-5', isSelected ? '' : 'text-white/80')} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] bg-white/20 rounded-full px-1 min-w-[16px] text-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact reaction summary display
interface ReactionSummaryProps {
  targetType: 'post' | 'comment';
  targetId: string;
  className?: string;
}

export function ReactionSummary({ targetType, targetId, className }: ReactionSummaryProps) {
  const { reactions, isLoading } = useReactions(targetType, targetId);

  if (isLoading || reactions.length === 0) return null;

  // Get unique emojis
  const uniqueEmojis = [...new Set(reactions.map(r => r.emoji))].slice(0, 3) as Emoji[];
  
  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-white/60', className)}>
      <div className="flex -space-x-1">
        {uniqueEmojis.map(emoji => {
          const Icon = EMOJI_CONFIG[emoji].icon;
          return (
            <span 
              key={emoji}
              className={cn(
                'inline-flex items-center justify-center h-5 w-5 rounded-full',
                EMOJI_CONFIG[emoji].color
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
          );
        })}
      </div>
      <span>{reactions.length}</span>
    </div>
  );
}
