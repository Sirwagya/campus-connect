import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type SpaceInviteRow = Database["public"]["Tables"]["space_invites"]["Row"];
type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
type SpaceMemberRow = Database["public"]["Tables"]["space_members"]["Row"];

type InviteWithSpaceDetails = SpaceInviteRow & {
    space: Pick<SpaceRow, "id" | "name" | "description" | "member_count" | "is_private" | "slug"> | null;
};

type InviteWithSpaceSlug = SpaceInviteRow & {
    space: Pick<SpaceRow, "id" | "slug"> | null;
};

type InviteResponse =
    | { invite: InviteWithSpaceDetails }
    | { error: string }
    | { spaceSlug: string; message?: string };

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    try {
        const supabase = await createServerSupabase();
        // No auth required to view invite details (public page)

        const { data: invite } = await supabase
            .from("space_invites")
            .select("*, space:spaces(id, name, description, member_count, is_private, slug)")
            .eq("code", code)
            .gt("expires_at", new Date().toISOString())
            .single<InviteWithSpaceDetails>();

        if (!invite) {
            return NextResponse.json<InviteResponse>({ error: "Invalid or expired invite" }, { status: 404 });
        }

        if (!invite.space) {
            return NextResponse.json<InviteResponse>({ error: "Invite is missing space data" }, { status: 500 });
        }

        if (invite.max_uses && (invite.uses ?? 0) >= invite.max_uses) {
            return NextResponse.json<InviteResponse>({ error: "Invite limit reached" }, { status: 410 });
        }

        return NextResponse.json<InviteResponse>({ invite });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json<InviteResponse>({ error: message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    try {
        const supabase = await createServerSupabase();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json<InviteResponse>({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Validate Invite
        const { data: invite } = await supabase
            .from("space_invites")
            .select("*, space:spaces(id, slug)")
            .eq("code", code)
            .gt("expires_at", new Date().toISOString())
            .single<InviteWithSpaceSlug>();

        if (!invite) {
            return NextResponse.json<InviteResponse>({ error: "Invalid or expired invite" }, { status: 404 });
        }

        if (!invite.space) {
            return NextResponse.json<InviteResponse>({ error: "Invite is missing space data" }, { status: 500 });
        }

        if (invite.max_uses && (invite.uses ?? 0) >= invite.max_uses) {
            return NextResponse.json<InviteResponse>({ error: "Invite limit reached" }, { status: 410 });
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabase
            .from("space_members")
            .select("id")
            .eq("space_id", invite.space_id)
            .eq("user_id", session.user.id)
            .single<Pick<SpaceMemberRow, "id">>();

        if (existingMember) {
            return NextResponse.json<InviteResponse>({
                spaceSlug: invite.space.slug,
                message: "Already a member",
            });
        }

        // 3. Add Member using Admin Client (Bypass RLS)
        const { error: joinError } = await supabaseAdmin
            .from("space_members")
            .insert({
                space_id: invite.space_id,
                user_id: session.user.id,
                role: "member",
            });

        if (joinError) {
            return NextResponse.json<InviteResponse>({ error: joinError.message }, { status: 500 });
        }

        // 4. Increment uses (RPC or direct update if admin)
        // Let's use direct update since we have admin
        await supabaseAdmin
            .from("space_invites")
            .update({ uses: (invite.uses ?? 0) + 1 })
            .eq("id", invite.id);

        // 5. Increment space member count
        await supabase.rpc("increment_space_member_count", { space_id: invite.space_id });

        return NextResponse.json<InviteResponse>({ spaceSlug: invite.space.slug });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json<InviteResponse>({ error: message }, { status: 500 });
    }
}
