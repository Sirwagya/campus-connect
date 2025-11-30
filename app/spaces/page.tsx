import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SpacesList } from "./SpacesList";

export default async function SpacesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch spaces
  console.log("Fetching spaces...");
  const { data: spaces, error } = await supabase
    .from("spaces")
    .select("*")
    .order("member_count", { ascending: false });

  // Fetch admin status
  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  const isAdmin = user?.is_admin || false;

  if (error) {
    console.error("Error fetching spaces:", JSON.stringify(error, null, 2));
  } else {
    console.log("Spaces fetched successfully:", spaces?.length);
  }

  return (
    <main className="container max-w-5xl mx-auto py-6 px-4">
      <SpacesList initialSpaces={spaces || []} isAdmin={isAdmin} />
    </main>
  );
}
