'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';

interface TypingUser {
  user_id: string;
  user_name: string;
  avatar_url?: string;
}

interface UseTypingIndicatorOptions {
  channelId: string;
  debounceMs?: number;
}

export function useTypingIndicator({ channelId, debounceMs = 1000 }: UseTypingIndicatorOptions) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const supabase = createClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`typing:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `channel_id=eq.${channelId}`,
        },
        async () => {
          // Fetch current typing users
          const { data } = await supabase
            .from('typing_indicators')
            .select(`
              user_id,
              users!inner(full_name, avatar_url)
            `)
            .eq('channel_id', channelId)
            .neq('user_id', user?.id || '');

          if (data) {
            interface TypingData {
              user_id: string;
              users: { full_name: string; avatar_url?: string } | null;
            }
            
            setTypingUsers(
              (data as unknown as TypingData[]).map((t) => ({
                user_id: t.user_id,
                user_name: t.users?.full_name || 'Someone',
                avatar_url: t.users?.avatar_url,
              }))
            );
          }
        }
      )
      .subscribe();

    // Initial fetch
    const fetchTypingUsers = async () => {
      const { data } = await supabase
        .from('typing_indicators')
        .select(`
          user_id,
          users!inner(full_name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .neq('user_id', user?.id || '');

      if (data) {
        interface TypingData {
          user_id: string;
          users: { full_name: string; avatar_url?: string } | null;
        }
        
        setTypingUsers(
          (data as unknown as TypingData[]).map((t) => ({
            user_id: t.user_id,
            user_name: t.users?.full_name || 'Someone',
            avatar_url: t.users?.avatar_url,
          }))
        );
      }
    };

    fetchTypingUsers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase, user?.id]);

  // Helper to delete typing indicator
  const deleteTypingIndicator = useCallback(async () => {
    if (!user || !channelId) return;

    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to stop typing indicator:', error);
    }
  }, [user, channelId, supabase]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!user || !channelId || isTypingRef.current) return;

    isTypingRef.current = true;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          channel_id: channelId,
          user_id: user.id,
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'channel_id,user_id',
        });
    } catch (error) {
      console.error('Failed to start typing indicator:', error);
    }

    // Auto-stop after debounce period
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      deleteTypingIndicator();
    }, debounceMs);
  }, [user, channelId, supabase, debounceMs, deleteTypingIndicator]);

  // Stop typing indicator (alias for external use)
  const stopTyping = deleteTypingIndicator;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Best effort cleanup
      if (user && channelId) {
        supabase
          .from('typing_indicators')
          .delete()
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .then(() => {});
      }
    };
  }, [user, channelId, supabase]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
  };
}

// UI Component for displaying typing indicators
interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].user_name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].user_name} and ${typingUsers[1].user_name} are typing`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].user_name}, ${typingUsers[1].user_name}, and ${typingUsers[2].user_name} are typing`;
    } else {
      return `${typingUsers[0].user_name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-white/60', className)}>
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
