import { createServerSupabase } from "@/lib/supabase-server";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function EventsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("approved", true)
    .order("start_ts", { ascending: true });

  // Check if admin
  let isAdmin = false;
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!userData?.is_admin;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Discover workshops, hackathons, and meetups on campus.
          </p>
        </div>
        {isAdmin && (
          <Link href="/admin/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events?.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {(!events || events.length === 0) && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
