'use client';

import { useRealtimeFeed } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';
import { ArrowUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewPostsBannerProps {
  spaceId?: string;
  onRefresh: () => void;
  className?: string;
}

export function NewPostsBanner({ spaceId, onRefresh, className }: NewPostsBannerProps) {
  const { newPosts, hasNewPosts, clearNewPosts } = useRealtimeFeed(spaceId);

  const handleClick = () => {
    onRefresh();
    clearNewPosts();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNewPosts();
  };

  return (
    <AnimatePresence>
      {hasNewPosts && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed top-20 left-1/2 -translate-x-1/2 z-50',
            className
          )}
        >
          <button
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[#1ed760] text-black font-semibold text-sm',
              'shadow-[0_4px_20px_rgba(30,215,96,0.4)]',
              'hover:bg-[#1fdf64] hover:scale-105',
              'active:scale-95 transition-all',
              'group'
            )}
          >
            <ArrowUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>
              {newPosts.length === 1 
                ? '1 new post' 
                : `${newPosts.length} new posts`}
            </span>
            <button
              onClick={handleDismiss}
              className="ml-1 p-0.5 rounded-full hover:bg-black/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
