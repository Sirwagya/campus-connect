import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { SpaceRole } from "@/types/spaces";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
type SpaceMemberRow = Database["public"]["Tables"]["space_members"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type SpaceMemberWithUser = SpaceMemberRow & {
    user?: Pick<UserRow, "id" | "name" | "full_name" | "avatar_url"> | null;
};

const SERVER_ERROR = "Internal server error";
const ALLOWED_ROLES: Array<Extract<SpaceRole, "moderator" | "member">> = [
    "moderator",
    "member",
];

const errorResponse = (message: string, status: number) =>
    NextResponse.json({ error: message }, { status });

const getSpace = async (
    supabase: Awaited<ReturnType<typeof createServerSupabase>>,
    slug: string
) =>
    supabase
        .from("spaces")
        .select("id, owner_id")
        .eq("slug", slug)
        .single<Pick<SpaceRow, "id" | "owner_id">>();

const getUserAdminFlag = async (
    supabase: Awaited<ReturnType<typeof createServerSupabase>>,
    userId: string
) =>
    supabase
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .single<Pick<UserRow, "is_admin">>();

const getMemberById = async (
    supabase: Awaited<ReturnType<typeof createServerSupabase>>,
    memberId: string,
    spaceId: string
) =>
    supabase
        .from("space_members")
        .select("id, user_id, role")
        .eq("id", memberId)
        .eq("space_id", spaceId)
        .single<Pick<SpaceMemberRow, "id" | "user_id" | "role">>();

// PATCH - Update member role (promote/demote to moderator)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
    try {
        const { slug, memberId } = await params;
        const supabase = await createServerSupabase();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return errorResponse("Unauthorized", 401);
        }

        const body = (await request.json()) as Partial<{ role: SpaceRole }>;
        if (!body.role || !ALLOWED_ROLES.includes(body.role as (typeof ALLOWED_ROLES)[number])) {
            return errorResponse("Invalid role. Must be \"moderator\" or \"member\"", 400);
        }

        const role = body.role as (typeof ALLOWED_ROLES)[number];

        const { data: space } = await getSpace(supabase, slug);
        if (!space) {
            return errorResponse("Space not found", 404);
        }

        const isOwner = space.owner_id === session.user.id;
        const { data: user } = await getUserAdminFlag(supabase, session.user.id);
        const isAdmin = user?.is_admin;

        if (!isOwner && !isAdmin) {
            return errorResponse("Only space owners can manage moderators", 403);
        }

        const { data: targetMember } = await getMemberById(
            supabase,
            memberId,
            space.id
        );

        if (!targetMember) {
            return errorResponse("Member not found", 404);
        }

        if (targetMember.role === "owner") {
            return errorResponse("Cannot change owner role", 403);
        }

        if (targetMember.user_id === session.user.id && isOwner) {
            return errorResponse("Cannot change your own role", 403);
        }

        const { data: updatedMember, error } = await supabase
            .from("space_members")
            .update({ role })
            .eq("id", memberId)
            .select(
                `
                *,
                user:users(id, name, full_name, avatar_url)
            `
            )
            .single<SpaceMemberWithUser>();

        if (error) {
            console.error("Error updating member role:", error);
            return errorResponse(error.message, 500);
        }

        return NextResponse.json({ member: updatedMember });
    } catch (error: unknown) {
        console.error("Error in PATCH /api/spaces/[slug]/members/[memberId]:", error);
        const message = error instanceof Error ? error.message : SERVER_ERROR;
        return errorResponse(message, 500);
    }
}

// DELETE - Remove member from space
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
    try {
        const { slug, memberId } = await params;
        const supabase = await createServerSupabase();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return errorResponse("Unauthorized", 401);
        }

        const { data: space } = await getSpace(supabase, slug);
        if (!space) {
            return errorResponse("Space not found", 404);
        }

        const { data: currentMembership } = await supabase
            .from("space_members")
            .select("role")
            .eq("space_id", space.id)
            .eq("user_id", session.user.id)
            .single<Pick<SpaceMemberRow, "role">>();

        const isOwner = space.owner_id === session.user.id;
        const isModerator = currentMembership?.role === "moderator";

        const { data: user } = await getUserAdminFlag(supabase, session.user.id);
        const isAdmin = user?.is_admin;

        const { data: targetMember } = await getMemberById(
            supabase,
            memberId,
            space.id
        );

        if (!targetMember) {
            return errorResponse("Member not found", 404);
        }

        if (targetMember.role === "owner") {
            return errorResponse("Cannot remove space owner", 403);
        }

        if (isModerator && !isOwner && !isAdmin && targetMember.role === "moderator") {
            return errorResponse("Moderators cannot remove other moderators", 403);
        }

        if (!isOwner && !isAdmin && !isModerator) {
            return errorResponse("Forbidden", 403);
        }

        const { error } = await supabase
            .from("space_members")
            .delete()
            .eq("id", memberId);

        if (error) {
            console.error("Error removing member:", error);
            return errorResponse(error.message, 500);
        }

        await supabase.rpc("decrement_space_member_count", { space_id: space.id });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Error in DELETE /api/spaces/[slug]/members/[memberId]:", error);
        const message = error instanceof Error ? error.message : SERVER_ERROR;
        return errorResponse(message, 500);
    }
}
