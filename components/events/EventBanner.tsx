"use client";

import { Badge } from "@/components/ui/Badge";
import { Event } from "@/types/events";

interface EventBannerProps {
  event: Event;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div
      className="relative w-full h-[300px] md:h-[400px] bg-cover bg-center flex items-end"
      style={{
        backgroundColor: event.color_block || "#e5e7eb",
        backgroundImage: event.image_path
          ? `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path})`
          : undefined,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="container mx-auto px-4 pb-8 relative z-10 text-white">
        <div className="flex flex-wrap gap-2 mb-4">
          {event.category && (
            <Badge
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur"
            >
              {event.category}
            </Badge>
          )}
          {event.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-white border-white/40"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-2">{event.title}</h1>

        {event.location && (
          <p className="text-white/80 text-lg flex items-center gap-2">
            📍 {event.location}
          </p>
        )}
      </div>
    </div>
  );
}
