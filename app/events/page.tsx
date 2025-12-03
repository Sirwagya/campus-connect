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
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container max-w-7xl mx-auto py-8 px-8 lg:px-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light mb-2 tracking-tight">Events</h1>
            <p className="text-white/60 font-light">
              Discover workshops, hackathons, and meetups on campus.
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin/events/create">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events?.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {(!events || events.length === 0) && (
            <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <p className="text-white/40 font-light">
                No upcoming events found.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
