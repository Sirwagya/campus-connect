"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, MapPin, Users, Play, Clock } from "lucide-react";
import { Event } from "@/types/events";
import Link from "next/link";
import { motion } from "framer-motion";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_ts);
  const isPast = startDate < new Date();

  return (
    <Link href={`/events/${event.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="group h-full"
      >
        <Card className="overflow-hidden glass-panel border-white/10 hover:border-white/20 transition-all h-full flex flex-col relative rounded-2xl">
          {/* Banner Image Area */}
          <div
            className="aspect-video w-full bg-cover bg-center relative group-hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: event.color_block || "#27272a",
              backgroundImage: event.image_path
                ? `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path})`
                : undefined,
            }}
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

            {/* Play Button Overlay (Spotify Style) */}
            <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform">
                <Play className="h-5 w-5 fill-current ml-1" />
              </div>
            </div>

            {event.category && (
              <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white border-none">
                {event.category}
              </Badge>
            )}
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg leading-tight text-white group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {event.title}
                </h3>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {startDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3" />
                  {startDate.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
              {event.description}
            </p>

            <div className="space-y-2 text-xs text-gray-500 mt-auto pt-3 border-t border-white/5">
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate text-gray-300">
                    {event.location}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-300">
                  {event.participants_count} registered
                  {event.capacity ? ` / ${event.capacity}` : ""}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
