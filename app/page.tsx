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
  Sparkles,
  Play,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "./actions/dashboard";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";

export default async function Home() {
  const { featuredEvents, announcements, trendingFeed, userRole } =
    await getDashboardData();

  return (
    <div className="min-h-screen bg-[#0E0E10] text-white pb-20 font-sans selection:bg-[#6C4BF4] selection:text-white">
      {/* Hero Section - Spotify Artist Page Style */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A2CCB] via-[#6C4BF4] to-[#0E0E10] opacity-90" />

        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

        {/* Soft Spotlight */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/10 blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />

        <div className="container max-w-7xl mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-4 w-4 text-[#6C4BF4]" />
            <span className="text-xs font-bold tracking-wide text-white uppercase">
              Welcome back, Sirwagya
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4 drop-shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Your Campus Pulse
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Discover events, catch up on announcements, and see what's trending
            in your community.
          </p>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0E0E10] to-transparent" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-16">
        {/* Featured Events - Spotify Playlist Cards */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              Featured Events
            </h2>
            <Link
              href="/events"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block"
                >
                  <div className="bg-[#18181B] rounded-lg p-4 hover:bg-[#27272a] transition-all duration-300 ease-out group-hover:-translate-y-2 shadow-lg hover:shadow-[#6C4BF4]/20 border border-white/5 group-hover:border-white/10">
                    <div className="aspect-square w-full bg-[#27272a] rounded-md mb-4 relative overflow-hidden shadow-md">
                      {event.image_path ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.image_path}`}
                          alt={event.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#3A2CCB] to-[#6C4BF4] flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      {/* Play Button Overlay */}
                      <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                        <div className="h-12 w-12 bg-[#6C4BF4] rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform">
                          <Play className="h-5 w-5 fill-current ml-1" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-white font-bold text-lg truncate mb-1">
                      {event.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2 min-h-[40px]">
                      {event.description || "No description."}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                      <span>{format(new Date(event.start_ts), "MMM d")}</span>
                      <span>•</span>
                      <span>{event.location || "On Campus"}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 bg-[#18181B]/50 border border-dashed border-white/5 rounded-xl">
                <Calendar className="h-10 w-10 mb-4 opacity-20" />
                <p>No upcoming featured events.</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Announcements - GitHub Notification Style */}
          <section className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#6C4BF4]" /> Announcements
            </h2>

            <div className="bg-[#18181B]/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden">
              {announcements.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {announcements.map((post) => (
                    <div
                      key={post.id}
                      className="p-5 hover:bg-white/5 transition-colors group cursor-pointer relative"
                    >
                      <div className="flex gap-4">
                        <div className="mt-1">
                          <div className="h-8 w-8 rounded-full bg-[#27272a] border border-white/10 flex items-center justify-center text-[#6C4BF4]">
                            <Bell className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold text-white group-hover:text-[#6C4BF4] transition-colors">
                              {post.user?.full_name || "Admin"}
                            </h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {format(new Date(post.created_at), "MMM d")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="h-16 w-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-white font-medium mb-1">
                    All caught up!
                  </h3>
                  <p className="text-gray-500 text-sm">
                    No new announcements at the moment.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Trending Feed - GitHub Issues + Spotify Tracks */}
          <section className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" /> Trending
              </h2>
              <Link
                href="/feed"
                className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider"
              >
                View Feed
              </Link>
            </div>

            <div className="space-y-3">
              {trendingFeed.length > 0 ? (
                trendingFeed.map((post) => (
                  <div
                    key={post.id}
                    className="group bg-[#18181B] hover:bg-[#202024] border border-white/5 hover:border-white/10 rounded-lg p-4 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${post.user?.id}`}>
                        <Avatar className="h-8 w-8 border border-white/10 cursor-pointer">
                          <AvatarImage
                            src={post.user?.avatar_url}
                            alt={post.user?.email || "User"}
                          />
                          <AvatarFallback>
                            {post.user?.email?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <Link
                            href={`/profile/${post.user?.id}`}
                            className="text-sm font-bold text-white hover:underline truncate"
                          >
                            @{post.user?.email?.split("@")[0]}
                          </Link>
                          <span className="text-[10px] text-gray-500">
                            {format(new Date(post.created_at), "MMM d")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-300 transition-colors">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                            <Heart className="h-3.5 w-3.5" />
                            <span>{post.likes_count}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{post.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-[#18181B] rounded-lg border border-white/5">
                  <p className="text-gray-500 text-sm">
                    No trending posts yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
