import { createServerSupabase } from "@/lib/supabase-server";
// Force rebuild
import { redirect, notFound } from "next/navigation";
import { SpaceChatClient } from "./SpaceChatClient";

export default async function SpaceChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch space details
  console.log("Fetching space with slug:", slug);
  const { data: space, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !space) {
    console.error("Error fetching space:", JSON.stringify(error, null, 2));

    // Debug: List available spaces to check for typos
    const { data: allSpaces } = await supabase
      .from("spaces")
      .select("slug, name")
      .limit(10);
    console.log("Requested slug:", slug);
    console.log(
      "Available spaces:",
      allSpaces?.map((s) => `${s.name} (${s.slug})`).join(", ")
    );

    notFound();
  }

  // Check membership
  const { data: member } = await supabase
    .from("space_members")
    .select("*")
    .eq("space_id", space.id)
    .eq("user_id", session.user.id)
    .single();

  return (
    <main className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      <SpaceChatClient
        space={space}
        initialMember={member}
        currentUser={session.user}
      />
    </main>
  );
}
