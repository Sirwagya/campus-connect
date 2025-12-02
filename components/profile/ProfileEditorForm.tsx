"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  Github,
  Linkedin,
  Globe,
  Twitter,
  ExternalLink,
  Folder,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { GitHubHeatmap } from "@/components/profile/GitHubHeatmap";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

// Types
interface Skill {
  id?: string;
  skill_name: string;
  category?: string;
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
}

interface Project {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  repo_url?: string;
  tech_stack: string[];
  is_featured?: boolean;
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

interface ProfileData {
  id?: string;
  bio?: string;
  tagline?: string;
  visibility?: "public" | "private";
  cover_url?: string;
  social_links?: SocialLinks;
}

interface ProfileEditorFormProps {
  initialProfile: ProfileData;
  initialAvatarUrl?: string;
  userId: string;
}

// Skill categories for dropdown
const SKILL_CATEGORIES = [
  "language",
  "frontend",
  "backend",
  "database",
  "devops",
  "mobile",
  "ai/ml",
  "other",
];

const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

/**
 * Extracts GitHub username from various URL formats:
 * - https://github.com/username
 * - http://github.com/username
 * - github.com/username
 * - www.github.com/username
 * - username (plain username)
 */
function extractGitHubUsername(input: string | undefined): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern to match GitHub URLs
  const urlPatterns = [
    /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)(?:\/.*)?$/i,
    /^(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)(?:\/.*)?$/i,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's a plain username (valid GitHub username pattern)
  const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  if (usernamePattern.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function ProfileEditorForm({
  initialProfile,
  initialAvatarUrl,
  userId,
}: ProfileEditorFormProps) {
  const router = useRouter();
  // Use memoized supabase client to prevent re-creation on every render
  const supabase = useMemo(() => createBrowserSupabase(), []);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Profile data
  const [profile, setProfile] = useState<ProfileData>(initialProfile || {});
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(initialProfile.cover_url || "");

  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("language");
  const [newSkillProficiency, setNewSkillProficiency] =
    useState<Skill["proficiency"]>("intermediate");

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<Project>({
    title: "",
    description: "",
    image_url: "",
    project_url: "",
    repo_url: "",
    tech_stack: [],
    is_featured: false,
  });
  const [newTech, setNewTech] = useState("");

  // Load existing skills and projects on mount
  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      if (!userId) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        // Load all data in parallel for better performance
        const [skillsResult, projectsResult, profileResult] = await Promise.all(
          [
            supabase
              .from("profile_skills")
              .select("*")
              .eq("user_id", userId)
              .order("display_order", { ascending: true }),
            supabase
              .from("profile_projects")
              .select("*")
              .eq("user_id", userId)
              .order("display_order", { ascending: true }),
            supabase.from("profiles").select("*").eq("id", userId).single(),
          ]
        );

        // Only update state if component is still mounted
        if (!isMounted) return;

        if (skillsResult.data) {
          setSkills(skillsResult.data);
        }

        if (projectsResult.data) {
          setProjects(
            (projectsResult.data as Project[]).map((p) => ({
              ...p,
              tech_stack: p.tech_stack || [],
            }))
          );
        }

        if (profileResult.data) {
          setProfile(profileResult.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading profile data:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [userId, supabase]);

  // Avatar upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    setIsUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error uploading avatar: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Cover upload handler
  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      // Allow larger size for banners/GIFs
      alert("File size must be less than 5MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `cover-${userId}-${Date.now()}.${fileExt}`;

    setIsUploading(true);

    try {
      // Using 'avatars' bucket for now as it's likely public/configured
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setCoverUrl(urlData.publicUrl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error uploading cover: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // SKILLS HANDLERS
  const addSkill = async () => {
    if (!newSkill.trim()) return;

    const skill: Skill = {
      skill_name: newSkill.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency,
    };

    try {
      const { data, error } = await supabase
        .from("profile_skills")
        .insert({
          user_id: userId,
          skill_name: skill.skill_name,
          category: skill.category,
          proficiency: skill.proficiency,
          display_order: skills.length,
        })
        .select()
        .single();

      if (error) throw error;

      setSkills([...skills, data]);
      setNewSkill("");
    } catch (error) {
      console.error("Error adding skill:", error);
      alert("Failed to add skill");
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from("profile_skills")
        .delete()
        .eq("id", skillId);

      if (error) throw error;

      setSkills(skills.filter((s) => s.id !== skillId));
    } catch (error) {
      console.error("Error removing skill:", error);
      alert("Failed to remove skill");
    }
  };

  // PROJECTS HANDLERS
  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      description: "",
      image_url: "",
      project_url: "",
      repo_url: "",
      tech_stack: [],
      is_featured: false,
    });
    setEditingProject(null);
    setShowProjectForm(false);
    setNewTech("");
  };

  const addTechToProject = () => {
    if (!newTech.trim()) return;
    if (!projectForm.tech_stack.includes(newTech.trim())) {
      setProjectForm({
        ...projectForm,
        tech_stack: [...projectForm.tech_stack, newTech.trim()],
      });
    }
    setNewTech("");
  };

  const removeTechFromProject = (tech: string) => {
    setProjectForm({
      ...projectForm,
      tech_stack: projectForm.tech_stack.filter((t) => t !== tech),
    });
  };

  const saveProject = async () => {
    if (!projectForm.title.trim()) {
      alert("Project title is required");
      return;
    }

    try {
      if (editingProject?.id) {
        // Update existing project
        const { data, error } = await supabase
          .from("profile_projects")
          .update({
            title: projectForm.title,
            description: projectForm.description,
            image_url: projectForm.image_url || null,
            project_url: projectForm.project_url || null,
            repo_url: projectForm.repo_url || null,
            tech_stack: projectForm.tech_stack,
            is_featured: projectForm.is_featured,
          })
          .eq("id", editingProject.id)
          .select()
          .single();

        if (error) throw error;

        setProjects(
          projects.map((p) =>
            p.id === editingProject.id
              ? { ...data, tech_stack: data.tech_stack || [] }
              : p
          )
        );
      } else {
        // Create new project
        const { data, error } = await supabase
          .from("profile_projects")
          .insert({
            user_id: userId,
            title: projectForm.title,
            description: projectForm.description,
            image_url: projectForm.image_url || null,
            project_url: projectForm.project_url || null,
            repo_url: projectForm.repo_url || null,
            tech_stack: projectForm.tech_stack,
            is_featured: projectForm.is_featured,
            display_order: projects.length,
          })
          .select()
          .single();

        if (error) throw error;

        setProjects([
          ...projects,
          { ...data, tech_stack: data.tech_stack || [] },
        ]);
      }

      resetProjectForm();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project");
    }
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      image_url: project.image_url || "",
      project_url: project.project_url || "",
      repo_url: project.repo_url || "",
      tech_stack: project.tech_stack || [],
      is_featured: project.is_featured || false,
    });
    setShowProjectForm(true);
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("profile_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  // SAVE ALL PROFILE DATA
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Clean social links (remove empty strings)
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(profile.social_links || {}).filter(
          ([_, v]) => v && v.trim() !== ""
        )
      );

      // Update Profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        bio: profile.bio || null,
        tagline: profile.tagline || null,
        visibility: profile.visibility || "public",
        social_links: cleanedSocialLinks,
        avatar_url: avatarUrl, // Sync avatar to profiles table
        cover_url: coverUrl,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Update Avatar in Users table
      if (avatarUrl !== initialAvatarUrl) {
        const { error: userError } = await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", userId);

        if (userError) throw userError;
      }

      router.refresh();
      router.push(`/profile/${userId}`);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white">
              Profile Picture
            </label>
            <div className="flex items-center gap-4 mt-2">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="h-16 w-16 rounded-full object-cover border border-white/20"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="bg-[#282828] border-white/10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isUploading
                    ? "Uploading..."
                    : "Upload a new profile picture (Max 2MB)"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">
                Or use a URL
              </label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/my-photo.jpg"
                className="mt-1 bg-[#282828] border-white/10"
              />
            </div>
          </div>

          {/* Cover Photo Section */}
          <div>
            <label className="text-sm font-medium text-white">
              Cover Photo (Banner)
            </label>
            <div className="flex flex-col gap-4 mt-2">
              {coverUrl && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/20">
                  <img
                    src={coverUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  disabled={isUploading}
                  className="bg-[#282828] border-white/10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isUploading
                    ? "Uploading..."
                    : "Upload a banner image or GIF (Max 5MB)"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">
                Or use a URL
              </label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/my-banner.gif"
                className="mt-1 bg-[#282828] border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white">Tagline</label>
            <Input
              value={profile.tagline || ""}
              onChange={(e) =>
                setProfile({ ...profile, tagline: e.target.value })
              }
              placeholder="Student at Campus Connect | Full Stack Developer"
              className="bg-[#282828] border-white/10"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white">Bio</label>
            <Textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              className="bg-[#282828] border-white/10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Github className="h-4 w-4" /> GitHub URL
              </label>
              <Input
                value={profile.social_links?.github || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      github: e.target.value,
                    },
                  })
                }
                placeholder="https://github.com/username"
                className="bg-[#282828] border-white/10"
              />
              {/* GitHub Username Extraction & Preview */}
              {(() => {
                const githubUsername = extractGitHubUsername(
                  profile.social_links?.github
                );
                if (githubUsername) {
                  return (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Username detected:
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          @{githubUsername}
                        </Badge>
                      </div>
                      {/* GitHub Contribution Graph Preview */}
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Contribution Graph Preview:
                        </p>
                        <GitHubHeatmap
                          githubUrl={`https://github.com/${githubUsername}`}
                          colorScheme="purple"
                          className="border border-white/5"
                        />
                      </div>
                    </div>
                  );
                } else if (
                  profile.social_links?.github &&
                  profile.social_links.github.length > 0
                ) {
                  return (
                    <p className="text-xs text-yellow-500 mt-1">
                      Could not extract username. Please use format:
                      https://github.com/username
                    </p>
                  );
                }
                return (
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for GitHub contribution graph on your profile
                  </p>
                );
              })()}
            </div>
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Linkedin className="h-4 w-4" /> LinkedIn URL
              </label>
              <Input
                value={profile.social_links?.linkedin || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      linkedin: e.target.value,
                    },
                  })
                }
                placeholder="https://linkedin.com/in/username"
                className="bg-[#282828] border-white/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Twitter className="h-4 w-4" /> Twitter URL
              </label>
              <Input
                value={profile.social_links?.twitter || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      twitter: e.target.value,
                    },
                  })
                }
                placeholder="https://twitter.com/username"
                className="bg-[#282828] border-white/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Portfolio / Website
              </label>
              <Input
                value={profile.social_links?.website || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      website: e.target.value,
                    },
                  })
                }
                placeholder="https://myportfolio.com"
                className="bg-[#282828] border-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="bg-[#282828] text-white border-white/10 py-1.5 px-3 flex items-center gap-2"
                >
                  <span>{skill.skill_name}</span>
                  {skill.proficiency && (
                    <span className="text-[10px] opacity-60 uppercase">
                      {skill.proficiency}
                    </span>
                  )}
                  <button
                    onClick={() => skill.id && removeSkill(skill.id)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${skill.skill_name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Skill Form */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Enter a skill (e.g., React, Python, Docker)"
              className="flex-1 bg-[#282828] border-white/10"
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="border rounded p-2 bg-[#282828] border-white/10 text-white"
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={newSkillProficiency}
              onChange={(e) =>
                setNewSkillProficiency(e.target.value as Skill["proficiency"])
              }
              className="border rounded p-2 bg-[#282828] border-white/10 text-white"
            >
              {PROFICIENCY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
            <Button
              onClick={addSkill}
              disabled={!newSkill.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Projects
          </CardTitle>
          {!showProjectForm && (
            <Button
              onClick={() => setShowProjectForm(true)}
              variant="outline"
              className="border-white/20 hover:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Form */}
          {showProjectForm && (
            <div className="bg-[#282828] rounded-lg p-4 space-y-4 border border-white/10">
              <h4 className="text-white font-medium">
                {editingProject ? "Edit Project" : "New Project"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Title *
                  </label>
                  <Input
                    value={projectForm.title}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, title: e.target.value })
                    }
                    placeholder="My Awesome Project"
                    className="bg-[#121212] border-white/10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Description
                  </label>
                  <Textarea
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your project..."
                    rows={3}
                    className="bg-[#121212] border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">
                    GitHub / Repo URL
                  </label>
                  <Input
                    value={projectForm.repo_url}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        repo_url: e.target.value,
                      })
                    }
                    placeholder="https://github.com/user/repo"
                    className="bg-[#121212] border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">
                    Live Demo URL
                  </label>
                  <Input
                    value={projectForm.project_url}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        project_url: e.target.value,
                      })
                    }
                    placeholder="https://myproject.com"
                    className="bg-[#121212] border-white/10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Image URL (optional)
                  </label>
                  <Input
                    value={projectForm.image_url}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        image_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/project-screenshot.png"
                    className="bg-[#121212] border-white/10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Tech Stack
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {projectForm.tech_stack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="bg-primary/20 text-primary"
                      >
                        {tech}
                        <button
                          onClick={() => removeTechFromProject(tech)}
                          className="ml-1 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Add technology (e.g., React, Node.js)"
                      className="bg-[#121212] border-white/10"
                      onKeyDown={(e) => e.key === "Enter" && addTechToProject()}
                    />
                    <Button
                      type="button"
                      onClick={addTechToProject}
                      variant="outline"
                      className="border-white/20"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={projectForm.is_featured}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        is_featured: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="is_featured" className="text-sm text-white">
                    Feature this project on my profile
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetProjectForm}>
                  Cancel
                </Button>
                <Button onClick={saveProject} className="bg-primary">
                  {editingProject ? "Update" : "Add"} Project
                </Button>
              </div>
            </div>
          )}

          {/* Existing Projects */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#282828] rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{project.title}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => editProject(project)}
                        className="p-1 hover:bg-white/10 rounded"
                        aria-label="Edit project"
                      >
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => project.id && deleteProject(project.id)}
                        className="p-1 hover:bg-red-500/20 rounded"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {project.description}
                  </p>
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack.slice(0, 4).map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-xs bg-white/5"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {project.tech_stack.length > 4 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-white/5"
                        >
                          +{project.tech_stack.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !showProjectForm && (
              <p className="text-muted-foreground text-sm italic">
                No projects yet. Add your first project to showcase your work!
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Visibility Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              className="border rounded p-2 bg-[#282828] border-white/10 text-white"
              value={profile.visibility || "public"}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  visibility: e.target.value as "public" | "private",
                })
              }
            >
              <option value="public">Public (Visible to everyone)</option>
              <option value="private">Private (Only me)</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 sticky bottom-4 bg-[#121212] p-4 rounded-lg border border-white/10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-white/20"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || isUploading}
          className="bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold"
        >
          {(isLoading || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
