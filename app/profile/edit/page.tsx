import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditorForm } from "@/components/profile/ProfileEditorForm";

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
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      <ProfileEditorForm
        initialProfile={profile}
        initialAvatarUrl={userData?.avatar_url}
        userId={user.id}
      />
    </div>
  );
}
