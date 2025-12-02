import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditorForm } from "@/components/profile/ProfileEditorForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user data (avatar)
  const { data: userData } = await supabase
    .from("users")
    .select("avatar_url, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/profile/${user.id}`}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">
              {userData?.full_name || "Update your profile information"}
            </p>
          </div>
        </div>

        <ProfileEditorForm
          initialProfile={profile || {}}
          initialAvatarUrl={userData?.avatar_url}
          userId={user.id}
        />
      </div>
    </div>
  );
}
