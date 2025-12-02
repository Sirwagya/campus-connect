'use client';

import { motion } from 'framer-motion';

// Base skeleton component with pulse animation
export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
      {...props}
    />
  );
}

// Shimmer effect skeleton
export function SkeletonShimmer({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden bg-white/5 rounded ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
    </div>
  );
}

// Post card skeleton
export function PostCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          
          {/* Content */}
          <div className="space-y-2 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Feed skeleton (multiple post cards)
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <PostCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Event card skeleton
export function EventCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-none" />
      
      <div className="p-4 space-y-3">
        {/* Date badge */}
        <Skeleton className="h-6 w-20" />
        
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Details */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

// Events grid skeleton
export function EventsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <EventCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Space card skeleton
export function SpaceCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Name */}
          <Skeleton className="h-5 w-32 mb-2" />
          
          {/* Description */}
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      
      {/* Member count */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Spaces grid skeleton
export function SpacesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <SpaceCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Profile header skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
        
        <div className="flex-1 text-center md:text-left">
          {/* Name */}
          <Skeleton className="h-7 w-48 mx-auto md:mx-0 mb-2" />
          
          {/* Username */}
          <Skeleton className="h-4 w-32 mx-auto md:mx-0 mb-4" />
          
          {/* Bio */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
            <Skeleton className="h-4 w-3/4 max-w-sm mx-auto md:mx-0" />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center md:justify-start gap-6">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        
        {/* Action button */}
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

// Alert card skeleton
export function AlertCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          
          {/* Description */}
          <div className="space-y-2 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          
          {/* Meta */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts list skeleton
export function AlertsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <AlertCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/10">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-4 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Dashboard stats skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </motion.div>
      ))}
    </div>
  );
}

// Comment skeleton
export function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="bg-white/5 rounded-lg p-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-3 mt-1 ml-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

// Comments list skeleton
export function CommentsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}

// Add shimmer keyframes to globals.css reminder
// @keyframes shimmer { 100% { transform: translateX(100%); } }
