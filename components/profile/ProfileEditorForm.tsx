"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileEditorFormProps {
  initialProfile: any;
  initialAvatarUrl?: string;
  userId: string;
}

export function ProfileEditorForm({
  initialProfile,
  initialAvatarUrl,
  userId,
}: ProfileEditorFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState(initialProfile || {});
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");

  // Local state for dynamic lists (skills, projects) would be managed here or in sub-components
  // For MVP, let's focus on core profile fields and a simple skill input

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setIsUploading(true);

    try {
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      alert(`Error uploading avatar: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update Profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        bio: profile.bio,
        tagline: profile.tagline,
        visibility: profile.visibility,
        social_links: profile.social_links,
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-4 mt-2">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
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
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tagline</label>
            <Input
              value={profile.tagline || ""}
              onChange={(e) =>
                setProfile({ ...profile, tagline: e.target.value })
              }
              placeholder="Student at Campus Connect | Full Stack Developer"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">GitHub URL</label>
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
              />
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn URL</label>
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
              />
            </div>
            <div>
              <label className="text-sm font-medium">Portfolio / Website</label>
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
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              className="border rounded p-2 bg-background"
              value={profile.visibility || "public"}
              onChange={(e) =>
                setProfile({ ...profile, visibility: e.target.value })
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

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || isUploading}>
          {(isLoading || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
