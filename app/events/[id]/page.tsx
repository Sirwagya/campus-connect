import { createServerSupabase } from "@/lib/supabase-server";
import { EventBanner } from "@/components/events/EventBanner";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { EventComments } from "@/components/events/EventComments";
import { EventReactions } from "@/components/events/EventReactions";
import { AddToCalendarButton } from "@/components/events/AddToCalendarButton";
import { Calendar, Clock, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createServerSupabase();
  const { id } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch event details
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  // Check registration status
  let isRegistered = false;
  if (user) {
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .single();
    isRegistered = !!registration;
  }

  const startDate = new Date(event.start_ts);
  const endDate = event.end_ts ? new Date(event.end_ts) : null;
  const isFull = event.capacity && event.participants_count >= event.capacity;

  return (
    <div className="min-h-screen bg-background pb-20">
      <EventBanner event={event} />

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b pb-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Event Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Hosted by Campus Connect
                  </p>
                </div>
                {user && (
                  <EventRegistrationModal
                    eventId={event.id}
                    isRegistered={isRegistered}
                    isFull={!!isFull}
                    participationType={event.participation_type || "solo"}
                    minTeamSize={event.min_team_size || 1}
                    maxTeamSize={event.max_team_size || 5}
                  />
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Reactions</h3>
              </div>
              <EventReactions eventId={event.id} currentUser={user} />
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <EventComments eventId={event.id} currentUser={user} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {startDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {startDate.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {endDate &&
                        ` - ${endDate.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}`}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2.5 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t space-y-3">
                <AddToCalendarButton event={event} />
                <Button variant="ghost" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
