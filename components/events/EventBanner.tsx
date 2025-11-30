"use client";

import { Badge } from "@/components/ui/Badge";
import { Event } from "@/types/events";
import { MapPin } from "lucide-react";

interface EventBannerProps {
  event: Event;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div
      className="relative w-full h-[400px] md:h-[500px] bg-cover bg-center flex items-end overflow-hidden"
      style={{
        backgroundColor: event.color_block || "#18181b",
        backgroundImage: event.image_path
          ? `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path})`
          : undefined,
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/60 to-transparent" />

      {/* Blur Effect at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#000000] to-transparent backdrop-blur-[2px]" />

      <div className="container mx-auto px-4 pb-12 relative z-10 text-white">
        <div className="flex flex-col gap-4 max-w-4xl">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <Badge
                variant="secondary"
                className="bg-primary/20 hover:bg-primary/30 text-primary border-none backdrop-blur-md px-3 py-1 text-sm font-medium"
              >
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-white/5 hover:bg-white/10 text-white border-white/10 backdrop-blur-md px-3 py-1 text-sm"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight drop-shadow-2xl">
            {event.title}
          </h1>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-white/80 text-lg md:text-xl font-medium">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
