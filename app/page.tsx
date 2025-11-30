import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Megaphone,
  TrendingUp,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "./actions/dashboard";
import { format } from "date-fns";

export default async function Home() {
  const { featuredEvents, announcements, trendingFeed, userRole } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Campus Connect.</p>
      </div>

      {/* Featured Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Featured Events
          </h2>
          <Button variant="link" asChild className="px-0">
            <Link href="/events">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.length > 0 ? (
            featuredEvents.map((event) => (
              <Card key={event.id} className="flex flex-col">
                <div className="aspect-video w-full bg-muted relative overflow-hidden rounded-t-lg">
                  {event.image_path ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path}`}
                      alt={event.title}
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.start_ts), "MMM d, yyyy • h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location || "TBD"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {event.description || "No description available."}
                  </p>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              No upcoming featured events.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Announcements */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Announcements
          </h2>
          <Card className="h-full">
            <CardContent className="p-0">
              {announcements.length > 0 ? (
                <ul className="divide-y">
                  {announcements.map((post) => (
                    <li
                      key={post.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-primary">
                          {post.user?.full_name || "Admin"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-3">{post.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No recent announcements.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Trending Posts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Trending on Feed
            </h2>
            <Button variant="link" asChild className="px-0">
              <Link href="/feed">
                View Feed <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {trendingFeed.length > 0 ? (
              trendingFeed.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">
                        @{post.user?.email?.split("@")[0] || "user"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.created_at), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{post.likes_count} Likes</span>
                      <span>{post.comments_count} Comments</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
                No trending posts yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
