import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LevelProgressBar } from "@/components/profile/LevelProgressBar";
import { IntegrationsPanel } from "@/components/profile/IntegrationsPanel";
import { SkillsAndTags } from "@/components/profile/SkillsAndTags";
import { ProfileProjects } from "@/components/profile/ProfileProjects";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { calculateLevel, LEVELS } from "@/lib/profile/leveling";
import { getUnifiedProfile } from "@/lib/profile/service";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // 1. Fetch Unified Profile (Single Source of Truth)
  // This uses supabaseAdmin internally to guarantee identical data for all viewers
  const profile = await getUnifiedProfile(id);

  if (!profile) {
    return notFound();
  }

  // 2. Determine Ownership
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwner = currentUser?.id === profile.id && !isPreview;

  // 3. Redirect Owner to Edit if Profile is Empty/New (Optional UX improvement)
  // If it's a fallback profile (no DB row) and user is owner, send to edit
  // We can detect fallback by checking if created_at is very recent or missing fields,
  // but for now let's just stick to the view.

  // 4. Calculate Level
  const levelData = calculateLevel(profile.stats?.total_xp || 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Section */}
      <ProfileHeader
        profile={profile as any}
        isOwner={isOwner}
        isPreview={isPreview}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl mt-8">
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
              <TabsList className="w-full justify-start bg-transparent border-b border-border p-0 h-auto rounded-none mb-6">
                <TabsTrigger
                  value="overview"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
                >
                  Projects
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Tab: Overview */}
              <TabsContent
                value="overview"
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <IntegrationsPanel profile={profile} isOwner={isOwner} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
