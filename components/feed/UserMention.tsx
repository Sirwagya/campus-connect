'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
}

function getMentionTrigger(text: string, cursorPosition: number) {
  // Check if we're in a mention context (after @)
  const beforeCursor = text.slice(0, cursorPosition);
  const mentionMatch = beforeCursor.match(/@(\w*)$/);
  
  if (mentionMatch) {
    return {
      isActive: true,
      query: mentionMatch[1],
      startIndex: mentionMatch.index!,
    };
  }
  
  return { isActive: false, query: '', startIndex: -1 };
}

export function UserMentionDropdown({ 
  query, 
  onSelect, 
  isVisible,
  position,
  className 
}: { 
  query: string;
  onSelect: (user: User) => void;
  isVisible: boolean;
  position?: { top: number; left: number };
  className?: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!isVisible || debouncedQuery.length < 1) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (response.ok) {
          const { users: results } = await response.json();
          setUsers(results || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, isVisible]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible || users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        onSelect(users[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setUsers([]);
        break;
    }
  }, [isVisible, users, selectedIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        'absolute z-50 w-64 bg-[#282828] rounded-lg border border-white/10 shadow-xl overflow-hidden',
        className
      )}
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      ) : users.length === 0 ? (
        <div className="px-3 py-4 text-sm text-white/50 text-center">
          {query.length < 1 ? 'Type to search users' : 'No users found'}
        </div>
      ) : (
        <ul className="py-1">
          {users.map((user, index) => (
            <li key={user.id}>
              <button
                onClick={() => onSelect(user)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 transition-colors',
                  index === selectedIndex 
                    ? 'bg-[#1ed760]/20 text-white' 
                    : 'text-white/80 hover:bg-white/5'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback className="bg-[#181818] text-white text-xs">
                    {user.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-medium truncate">{user.name}</span>
                  {user.username && (
                    <span className="text-xs text-white/50">@{user.username}</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Hook for managing mentions in a textarea
export function useMentions() {
  const [mentionState, setMentionState] = useState({
    isActive: false,
    query: '',
    startIndex: -1,
  });

  const checkForMention = useCallback((text: string, cursorPosition: number) => {
    const result = getMentionTrigger(text, cursorPosition);
    setMentionState(result);
    return result;
  }, []);

  const insertMention = useCallback((
    text: string, 
    user: User, 
    startIndex: number
  ): string => {
    const before = text.slice(0, startIndex);
    const afterMatch = text.slice(startIndex).match(/@\w*/);
    const after = afterMatch 
      ? text.slice(startIndex + afterMatch[0].length) 
      : text.slice(startIndex);
    
    return `${before}@${user.username || user.name.replace(/\s/g, '')} ${after}`;
  }, []);

  const clearMention = useCallback(() => {
    setMentionState({ isActive: false, query: '', startIndex: -1 });
  }, []);

  return {
    mentionState,
    checkForMention,
    insertMention,
    clearMention,
  };
}
