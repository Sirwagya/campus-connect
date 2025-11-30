import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { User, Briefcase, GraduationCap } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LevelProgressBar } from "@/components/profile/LevelProgressBar";
import { IntegrationsPanel } from "@/components/profile/IntegrationsPanel";
import { SkillsAndTags } from "@/components/profile/SkillsAndTags";
import { ProfileProjects } from "@/components/profile/ProfileProjects";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { calculateLevel, LEVELS } from "@/lib/profile/leveling";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const supabase = await createClient();

  // Helper to check if string is UUID
  const isUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let profile = null;
  let error = null;

  // 1. Fetch Profile Data
  if (isUUID(id)) {
    const result = await supabase
      .from("profiles")
      .select(
        `
        *,
        user:users(full_name, email, avatar_url, role, username),
        stats:coding_stats_unified(*),
        integrations:profile_integrations(*),
        skills:profile_skills(*),
        projects:profile_projects(*),
        experience:profile_experience(*),
        education:profile_education(*)
      `
      )
      .eq("id", id)
      .single();
    profile = result.data;
    error = result.error;
  } else {
    // Fetch by Username
    const result = await supabase
      .from("profiles")
      .select(
        `
        *,
        user:users(full_name, email, avatar_url, role, username),
        stats:coding_stats_unified(*),
        integrations:profile_integrations(*),
        skills:profile_skills(*),
        projects:profile_projects(*),
        experience:profile_experience(*),
        education:profile_education(*)
      `
      )
      .eq("username", id)
      .single();
    profile = result.data;
    error = result.error;
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 2. Determine Ownership
  const realIsOwner =
    (profile && currentUser?.id === profile.id) ||
    (!profile && isUUID(id) && currentUser?.id === id);

  const isOwner = realIsOwner && !isPreview;

  // 3. Handle Missing Profile (Fallback)
  if (error || !profile) {
    if (realIsOwner && !isPreview) {
      redirect("/profile/edit");
    }

    // Fallback for users without profile row using supabaseAdmin
    let user = null;
    let userError = null;

    if (isUUID(id)) {
      const res = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("id", id)
        .single();
      user = res.data;
      userError = res.error;
    } else {
      const res = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("username", id)
        .single();
      user = res.data;
      userError = res.error;
    }

    if (userError || !user) {
      return notFound();
    }

    // Construct Fallback Profile Object
    profile = {
      id: user.id,
      user: user,
      display_name: user.full_name || user.email?.split("@")[0],
      username: user.email?.split("@")[0],
      bio: null,
      tagline: "Student at Campus Connect",
      created_at: new Date().toISOString(),
      stats: { total_xp: 0 },
      skills: [],
      projects: [],
      experience: [],
      education: [],
      social_links: {},
      integrations: [],
      visibility: "public",
    };
  }

  // 4. Calculate Level
  const levelData = calculateLevel(profile.stats?.total_xp || 0);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header Section */}
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        isPreview={isPreview}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Main Content) - Spans 8 cols */}
          <div className="lg:col-span-8 space-y-8">
            {/* Level Progress (Visible on all tabs) */}
            <LevelProgressBar
              level={
                LEVELS.findIndex(
                  (l) => l.name === levelData.currentLevel.name
                ) + 1
              }
              currentXP={profile.stats?.total_xp || 0}
              nextLevelXP={
                levelData.nextLevel?.minXP || levelData.currentLevel.minXP
              }
              progress={levelData.progress}
            />

            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-6">
                <TabsTrigger
                  value="overview"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#a970ff] data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground hover:text-white transition-colors"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#a970ff] data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground hover:text-white transition-colors"
                >
                  Projects
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#a970ff] data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground hover:text-white transition-colors"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Tab: Overview */}
              <TabsContent
                value="overview"
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <IntegrationsPanel profile={profile} />
                <div className="block lg:hidden">
                  {/* Mobile: Show Skills here too if sidebar is stacked */}
                  <SkillsAndTags
                    skills={profile.skills || []}
                    isOwner={isOwner}
                  />
                </div>
              </TabsContent>

              {/* Tab: Projects */}
              <TabsContent
                value="projects"
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <ProfileProjects projects={profile.projects || []} />
              </TabsContent>

              {/* Tab: About */}
              <TabsContent
                value="about"
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <ProfileAbout profile={profile} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column (Sidebar) - Spans 4 cols */}
          <div className="lg:col-span-4 space-y-8 hidden lg:block">
            {/* Skills & Tags */}
            <SkillsAndTags skills={profile.skills || []} isOwner={isOwner} />

            {/* Additional Sidebar Widgets can go here (e.g. Recent Activity, Friends) */}
          </div>
        </div>
      </div>
    </div>
  );
}
