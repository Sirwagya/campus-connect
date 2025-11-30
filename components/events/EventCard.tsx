"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { Event } from "@/types/events";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_ts);
  const isPast = startDate < new Date();

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col group">
        {/* Banner Image or Color Block */}
        <div
          className="h-40 w-full bg-cover bg-center relative"
          style={{
            backgroundColor: event.color_block || "#e5e7eb",
            backgroundImage: event.image_path
              ? `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path})`
              : undefined,
          }}
        >
          {event.category && (
            <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground hover:bg-background/90">
              {event.category}
            </Badge>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                {startDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
              </p>
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {event.title}
              </h3>
            </div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
            {event.description}
          </p>

          <div className="space-y-2 text-xs text-muted-foreground mt-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {startDate.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>
                {event.participants_count} registered
                {event.capacity ? ` / ${event.capacity}` : ""}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
