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

  // Fetch admin status and user's space memberships
  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  // Fetch user's memberships to determine role in each space
  const { data: memberships } = await supabase
    .from("space_members")
    .select("space_id, role")
    .eq("user_id", session.user.id);

  const isAdmin = user?.is_admin || false;
  const membershipMap = new Map(
    memberships?.map((m) => [m.space_id, m.role]) || []
  );

  if (error) {
    console.error("Error fetching spaces:", JSON.stringify(error, null, 2));
  } else {
    console.log("Spaces fetched successfully:", spaces?.length);
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container max-w-[1280px] mx-auto py-12 px-8 lg:px-12">
        <SpacesList
          initialSpaces={spaces || []}
          isAdmin={isAdmin}
          currentUserId={session.user.id}
          membershipMap={Object.fromEntries(membershipMap)}
        />
      </div>
    </main>
  );
}
