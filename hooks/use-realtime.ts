'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ================================================================
// Presence Hook
// ================================================================

type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

interface PresenceState {
  status: PresenceStatus;
  customStatus?: string;
  lastSeen?: string;
}

export function usePresence(userId?: string) {
  const [presence, setPresence] = useState<PresenceState | null>(null);
  const [isLoading, setIsLoading] = useState(!!userId);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const fetchPresence = async () => {
      const { data } = await supabase
        .from('presence')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (mounted) {
        setPresence(data ? {
          status: data.status as PresenceStatus,
          customStatus: data.custom_status || undefined,
          lastSeen: data.last_seen,
        } : { status: 'offline' });
        setIsLoading(false);
      }
    };

    fetchPresence();

    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (!mounted) return;
          if (payload.eventType === 'DELETE') {
            setPresence({ status: 'offline' });
          } else {
            const data = payload.new as Record<string, unknown>;
            setPresence({
              status: (data.status as PresenceStatus) || 'offline',
              customStatus: data.custom_status as string | undefined,
              lastSeen: data.last_seen as string | undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { presence, isLoading };
}

// ================================================================
// Update Own Presence Hook
// ================================================================

export function useUpdatePresence() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePresence = useCallback(async (status: PresenceStatus, customStatus?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, custom_status: customStatus }),
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const setOnline = useCallback(() => updatePresence('online'), [updatePresence]);
  const setAway = useCallback(() => updatePresence('away'), [updatePresence]);
  const setBusy = useCallback(() => updatePresence('busy'), [updatePresence]);
  const setOffline = useCallback(() => updatePresence('offline'), [updatePresence]);

  useEffect(() => {
    setOnline();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAway();
      } else {
        setOnline();
      }
    };

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/presence', JSON.stringify({ status: 'offline' }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [setOnline, setAway, setOffline]);

  return { updatePresence, isUpdating, setOnline, setAway, setBusy, setOffline };
}

// ================================================================
// Follow Status Hook
// ================================================================

interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followerCount: number;
  followingCount: number;
}

export function useFollowStatus(targetUserId?: string) {
  const [status, setStatus] = useState<FollowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(!!targetUserId);

  const fetchStatus = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await fetch(`/api/follows/check?targetUserId=${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const follow = useCallback(async () => {
    if (!targetUserId) return false;
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (response.ok) {
        setStatus(prev => prev ? {
          ...prev,
          isFollowing: true,
          followerCount: prev.followerCount + 1,
        } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [targetUserId]);

  const unfollow = useCallback(async () => {
    if (!targetUserId) return false;
    try {
      const response = await fetch(`/api/follows?targetUserId=${targetUserId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStatus(prev => prev ? {
          ...prev,
          isFollowing: false,
          followerCount: Math.max(0, prev.followerCount - 1),
        } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [targetUserId]);

  return { status, isLoading, follow, unfollow, refetch: fetchStatus };
}

// ================================================================
// Reactions Hook
// ================================================================

type Emoji = 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'funny';

interface Reaction {
  id: string;
  emoji: Emoji;
  user_id: string;
  user?: { id: string; full_name: string; avatar_url: string };
}

export function useReactions(targetType: 'post' | 'comment', targetId: string) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [myReaction, setMyReaction] = useState<Emoji | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const initialFetchDone = useRef(false);

  const fetchReactions = useCallback(async () => {
    const response = await fetch(`/api/reactions?targetType=${targetType}&targetId=${targetId}`);
    if (response.ok) {
      const { data } = await response.json();
      setReactions(data || []);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const myReactionData = data?.find((r: Reaction) => r.user_id === user.id);
        setMyReaction(myReactionData?.emoji || null);
      }
    }
    setIsLoading(false);
  }, [targetType, targetId, supabase]);

  // Initial fetch - using a flag to ensure single execution
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
    }
  }, []);

  // Separate effect for actual data fetching
  useEffect(() => {
    if (initialFetchDone.current) {
      fetchReactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `target_type=eq.${targetType}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const data = payload.new as Record<string, unknown>;
          const oldData = payload.old as Record<string, unknown>;
          if (data?.target_id === targetId || oldData?.target_id === targetId) {
            fetchReactions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, fetchReactions, supabase]);

  const react = useCallback(async (emoji: Emoji) => {
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, emoji }),
    });
    
    if (response.ok) {
      const { action } = await response.json();
      if (action === 'removed') {
        setMyReaction(null);
      } else {
        setMyReaction(emoji);
      }
      fetchReactions();
    }
  }, [targetType, targetId, fetchReactions]);

  const removeReaction = useCallback(async () => {
    const response = await fetch(`/api/reactions?targetType=${targetType}&targetId=${targetId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setMyReaction(null);
      fetchReactions();
    }
  }, [targetType, targetId, fetchReactions]);

  return { reactions, myReaction, isLoading, react, removeReaction };
}

// ================================================================
// Real-time Feed Hook
// ================================================================

export function useRealtimeFeed(spaceId?: string) {
  const [newPosts, setNewPosts] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const filter = spaceId ? `space_id=eq.${spaceId}` : undefined;
    
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newRecord = payload.new as Record<string, unknown> | undefined;
          if (newRecord && 'id' in newRecord && typeof newRecord.id === 'string') {
            setNewPosts(prev => [newRecord.id as string, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId, supabase]);

  const clearNewPosts = useCallback(() => {
    setNewPosts([]);
  }, []);

  return { newPosts, hasNewPosts: newPosts.length > 0, clearNewPosts };
}
