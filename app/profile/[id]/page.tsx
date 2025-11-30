import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  Github,
  Linkedin,
  Globe,
  MapPin,
  Calendar,
  Trophy,
  Code,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { calculateLevel } from "@/lib/profile/leveling";
import { CodingDashboard } from "@/components/profile/CodingDashboard";

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

  // Fetch Profile Data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      user:users(full_name, email, avatar_url, role),
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

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const realIsOwner = currentUser?.id === id;
  const isOwner = realIsOwner && !isPreview;

  if (error || !profile) {
    if (realIsOwner && !isPreview) {
      redirect("/profile/edit");
    }

    // If profile not found, check if user exists in public.users
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("full_name, email, avatar_url, role")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return notFound();
    }

    // Render profile with default/empty values for user without profile entry
    const emptyProfile = {
      user: user,
      bio: null,
      tagline: "Student at Campus Connect",
      created_at: new Date().toISOString(), // Approximation or fetch from auth if possible, but users table doesn't usually have it public
      stats: {
        total_xp: 0,
        github_contributions: 0,
        leetcode_problems: 0,
        codeforces_rating: 0,
      },
      skills: [],
      projects: [],
      experience: [],
      education: [],
      social_links: {},
      integrations: [],
    };

    const levelInfo = calculateLevel(0);

    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {realIsOwner && isPreview && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-medium">
                You are viewing your profile as others see it.
              </span>
            </div>
            <Button asChild variant="default" size="sm">
              <Link href={`/profile/${id}`}>Exit Preview</Link>
            </Button>
          </div>
        )}

        {/* Header Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-gray-400 to-gray-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <Avatar
                className="h-32 w-32 border-4 border-background"
                src={user.avatar_url}
                fallback={user.full_name?.charAt(0) || user.email?.charAt(0)}
              />
              <div className="flex gap-2 mb-2">
                {realIsOwner && !isPreview && (
                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/profile/${id}?preview=true`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Public
                      </Link>
                    </Button>
                    <Button asChild variant="default">
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {user.full_name || "Unknown User"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Student at Campus Connect
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 capitalize">
                  <Badge variant="secondary">{user.role || "Student"}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-muted-foreground">
                    Profile Not Set Up
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Skills */}
          <div className="space-y-8">
            {/* Level Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">
                    {levelInfo.currentLevel.name}
                  </div>
                  <div className="text-sm text-muted-foreground">0 XP</div>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{levelInfo.currentLevel.minXP} XP</span>
                  <span>{levelInfo.nextLevel?.minXP || "Max"} XP</span>
                </div>
              </CardContent>
            </Card>

            {/* Coding Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Coding Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    GitHub Contributions
                  </span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    LeetCode Problems
                  </span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Codeforces Rating
                  </span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">
                    No skills added yet.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Content Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="coding">Coding</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground italic">
                      No bio provided yet.
                    </p>
                  </CardContent>
                </Card>

                {/* Education */}
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      No education details added.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coding" className="space-y-6">
                <CodingDashboard stats={emptyProfile.stats} integrations={[]} />
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <div className="text-center py-12 text-muted-foreground">
                  No projects showcased yet.
                </div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <div className="text-center py-12 text-muted-foreground">
                  No experience added yet.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Check Visibility
  if (profile.visibility === "private" && !isOwner) {
    return (
      <div className="container mx-auto py-20 text-center max-w-5xl">
        {realIsOwner && isPreview && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-medium">
                You are viewing your profile as others see it.
              </span>
            </div>
            <Button asChild variant="default" size="sm">
              <Link href={`/profile/${id}`}>Exit Preview</Link>
            </Button>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">Private Profile</h1>
        <p className="text-muted-foreground">
          This user's profile is set to private.
        </p>
      </div>
    );
  }

  const levelInfo = calculateLevel(profile.stats?.total_xp || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {realIsOwner && isPreview && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex items-center justify-between sticky top-20 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <span className="font-medium">
              You are viewing your profile as others see it.
            </span>
          </div>
          <Button asChild variant="default" size="sm">
            <Link href={`/profile/${id}`}>Exit Preview</Link>
          </Button>
        </div>
      )}

      {/* Header Section */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <Avatar
              className="h-32 w-32 border-4 border-background"
              src={profile.user?.avatar_url}
              fallback={profile.user?.full_name?.charAt(0)}
            />
            <div className="flex gap-2 mb-2">
              {isOwner && (
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/profile/${id}?preview=true`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Public
                    </Link>
                  </Button>
                  <Button asChild variant="default">
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{profile.user?.full_name}</h1>
              <p className="text-lg text-muted-foreground">
                {profile.tagline || "Student at Campus Connect"}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.user?.role && (
                <span className="flex items-center gap-1 capitalize">
                  <Badge variant="secondary">{profile.user.role}</Badge>
                </span>
              )}
              {/* Location would be in profile if added */}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Joined{" "}
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {profile.social_links?.github && (
                <Link
                  href={profile.social_links.github}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </Link>
              )}
              {profile.social_links?.linkedin && (
                <Link
                  href={profile.social_links.linkedin}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {profile.social_links?.website && (
                <Link
                  href={profile.social_links.website}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Skills */}
        <div className="space-y-8">
          {/* Level Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">
                  {levelInfo.currentLevel.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {profile.stats?.total_xp || 0} XP
                </div>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{levelInfo.currentLevel.minXP} XP</span>
                <span>{levelInfo.nextLevel?.minXP || "Max"} XP</span>
              </div>
            </CardContent>
          </Card>

          {/* Coding Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Coding Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  GitHub Contributions
                </span>
                <span className="font-medium">
                  {profile.stats?.github_contributions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  LeetCode Problems
                </span>
                <span className="font-medium">
                  {profile.stats?.leetcode_problems || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Codeforces Rating
                </span>
                <span className="font-medium">
                  {profile.stats?.codeforces_rating || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill: any) => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.skill_name}
                  </Badge>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <span className="text-sm text-muted-foreground">
                    No skills added yet.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="coding">Coding</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {profile.bio || "No bio provided."}
                  </p>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.education?.map((edu: any) => (
                    <div key={edu.id} className="flex gap-4">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <span className="text-xl">🎓</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{edu.institution}</h3>
                        <p className="text-sm text-muted-foreground">
                          {edu.degree}{" "}
                          {edu.field_of_study && `in ${edu.field_of_study}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {edu.start_date} - {edu.end_date || "Present"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!profile.education || profile.education.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No education details added.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coding" className="space-y-6">
              <CodingDashboard
                stats={profile.stats}
                integrations={profile.integrations || []}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              {profile.projects?.map((project: any) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <div className="flex gap-2">
                        {project.repo_url && (
                          <Link
                            href={project.repo_url}
                            target="_blank"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Github className="h-5 w-5" />
                          </Link>
                        )}
                        {project.project_url && (
                          <Link
                            href={project.project_url}
                            target="_blank"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Globe className="h-5 w-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.map((tech: string) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!profile.projects || profile.projects.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  No projects showcased yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
              {profile.experience?.map((exp: any) => (
                <Card key={exp.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <span className="text-xl">💼</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{exp.role}</h3>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.start_date} - {exp.end_date || "Present"} •{" "}
                          {exp.location}
                        </p>
                        <p className="text-sm mt-3 text-muted-foreground">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!profile.experience || profile.experience.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  No experience added yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
