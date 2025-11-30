import { createServerSupabase } from "@/lib/supabase-server";
import { EventBanner } from "@/components/events/EventBanner";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { EventComments } from "@/components/events/EventComments";
import { EventReactions } from "@/components/events/EventReactions";
import { AddToCalendarButton } from "@/components/events/AddToCalendarButton";
import { EventRegistrationButton } from "@/components/events/EventRegistrationButton";
import { Calendar, Clock, MapPin, Share2, Users } from "lucide-react";
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
    <div className="min-h-screen bg-[#000000] text-white pb-20">
      <EventBanner event={event} />

      <div className="container max-w-[1280px] mx-auto px-6 md:px-10 -mt-12 relative z-20">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Main Content */}
          <div className="space-y-10">
            {/* Description Card */}
            <div className="bg-[#131313] rounded-2xl p-8 border border-[#1f1f1f] shadow-xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center border-b border-[#1f1f1f] pb-8 mb-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    About Event
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Hosted by Campus Connect</span>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white">
                <p className="whitespace-pre-wrap leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Reactions Section */}
            <div className="bg-[#131313] rounded-2xl p-8 border border-[#1f1f1f] shadow-sm">
              <h3 className="text-xl font-bold mb-6">Reactions</h3>
              <EventReactions eventId={event.id} currentUser={user} />
            </div>

            {/* Comments Section */}
            <div className="bg-[#131313] rounded-2xl p-8 border border-[#1f1f1f] shadow-sm">
              <EventComments eventId={event.id} currentUser={user} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-[#131313]/80 backdrop-blur-md rounded-2xl p-6 border border-[#1f1f1f] shadow-2xl sticky top-24 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Registration Status</span>
                  <span className={isFull ? "text-red-400" : "text-green-400"}>
                    {isFull ? "Closed" : "Open"}
                  </span>
                </div>

                {user ? (
                  <EventRegistrationButton
                    eventId={event.id}
                    isRegistered={isRegistered}
                    isFull={!!isFull}
                  />
                ) : (
                  <Button className="w-full h-12 text-lg font-bold" disabled>
                    Login to Register
                  </Button>
                )}

                {event.capacity && (
                  <div className="w-full bg-[#27272a] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (event.participants_count / event.capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}

                {event.capacity && (
                  <p className="text-center text-sm text-muted-foreground">
                    {event.capacity - event.participants_count} spots remaining
                  </p>
                )}
              </div>

              <div className="h-px bg-[#27272a]" />

              {/* Metadata */}
              <div className="space-y-5">
                <div className="flex items-start gap-4 group">
                  <div className="bg-[#18181B] p-3 rounded-xl border border-[#27272a] group-hover:border-primary/50 group-hover:text-primary transition-colors">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white mb-0.5">Date</p>
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

                <div className="flex items-start gap-4 group">
                  <div className="bg-[#18181B] p-3 rounded-xl border border-[#27272a] group-hover:border-primary/50 group-hover:text-primary transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white mb-0.5">Time</p>
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
                  <div className="flex items-start gap-4 group">
                    <div className="bg-[#18181B] p-3 rounded-xl border border-[#27272a] group-hover:border-primary/50 group-hover:text-primary transition-colors">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-0.5">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <AddToCalendarButton event={event} />
                <Button
                  variant="ghost"
                  className="w-full hover:bg-[#27272a] hover:text-white"
                >
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
