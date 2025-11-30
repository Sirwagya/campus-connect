"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Event } from "@/types/events";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_ts", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      setEvents((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Event Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage campus events.
          </p>
        </div>
        <Link href="/admin/events/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No events found. Create one to get started.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {event.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {event.category && (
                          <Badge
                            variant="secondary"
                            className="mr-2 text-[10px] h-5 px-1.5"
                          >
                            {event.category}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(event.start_ts).toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.start_ts).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {event.location || "TBD"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {event.participants_count}
                          {event.capacity ? ` / ${event.capacity}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/events/${event.id}/participants`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View Participants"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
