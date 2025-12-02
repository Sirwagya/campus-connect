import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return (
    <SettingsClient 
      user={{
        id: session.user.id,
        email: session.user.email || "",
        name: profile?.full_name || profile?.name || session.user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url ?? undefined,
      }} 
    />
  );
}
