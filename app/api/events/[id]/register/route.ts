import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { EventRegistrationPayload, TeamMemberInput } from "@/types/events";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const isTeamMemberInput = (candidate: unknown): candidate is TeamMemberInput => {
    if (!candidate || typeof candidate !== "object") {
        return false;
    }
    const member = candidate as Partial<TeamMemberInput>;
    return (
        typeof member.name === "string" &&
        typeof member.email === "string" &&
        typeof member.role === "string"
    );
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id: eventId } = await params;

    let body: Partial<EventRegistrationPayload> = {};
    try {
        body = (await request.json()) as Partial<EventRegistrationPayload>;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid request body";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const {
        participationType,
        teamAction,
        teamName,
        teamCode,
        members: rawMembers,
        formData,
    } = body;

    if (participationType !== "solo" && participationType !== "team") {
        return NextResponse.json({ error: "Invalid participation type" }, { status: 400 });
    }

    let members: TeamMemberInput[] = [];
    if (rawMembers !== undefined) {
        if (!Array.isArray(rawMembers) || !rawMembers.every(isTeamMemberInput)) {
            return NextResponse.json(
                { error: "Invalid team members payload" },
                { status: 400 }
            );
        }
        members = rawMembers;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Event Details
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single<EventRow>();

    if (eventError || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Check Capacity (Simple check, race condition possible but acceptable for now)
    const capacity = event.capacity ?? null;
    const currentParticipants = event.participants_count ?? 0;
    if (capacity !== null && currentParticipants >= capacity) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }

    // 3. Handle Form Response
    let formResponseId = null;
    if (formData) {
        // Fetch form id
        const { data: form } = await supabase
            .from("event_forms")
            .select("id")
            .eq("event_id", eventId)
            .single();

        if (form) {
            const { data: response, error: responseError } = await supabase
                .from("event_form_responses")
                .insert({
                    form_id: form.id,
                    user_id: user.id,
                    response: formData,
                })
                .select("id")
                .single();

            if (responseError) {
                return NextResponse.json(
                    { error: "Failed to save form response: " + responseError.message },
                    { status: 500 }
                );
            }
            formResponseId = response.id;
        }
    }

    // 4. Handle Team Logic
    let teamId: string | null = null;

    if (participationType === "team") {
        if (!teamAction) {
            return NextResponse.json(
                { error: "Team action is required for team registrations" },
                { status: 400 }
            );
        }

        if (teamAction === "create") {
            const sanitizedTeamName = teamName?.trim();
            if (!sanitizedTeamName) {
                return NextResponse.json(
                    { error: "Team name is required" },
                    { status: 400 }
                );
            }

            // Validate team size
            const minSize = event.min_team_size ?? 1;
            const maxSize = event.max_team_size ?? 5;
            const totalMembers = members.length + 1; // include leader

            if (totalMembers < minSize) {
                return NextResponse.json(
                    { error: `Minimum team size is ${minSize}` },
                    { status: 400 }
                );
            }
            if (totalMembers > maxSize) {
                return NextResponse.json(
                    { error: `Maximum team size is ${maxSize}` },
                    { status: 400 }
                );
            }

            // Create Team
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: team, error: teamError } = await supabase
                .from("teams")
                .insert({
                    event_id: eventId,
                    name: sanitizedTeamName,
                    code,
                    leader_id: user.id,
                })
                .select("id")
                .single();

            if (teamError) {
                return NextResponse.json(
                    { error: "Failed to create team: " + teamError.message },
                    { status: 500 }
                );
            }
            teamId = team.id;

            // Add Members
            if (members.length > 0) {
                // Validate all members have userId (enforce registered users)
                const invalidMembers = members.filter((member) => !member.userId);
                if (invalidMembers.length > 0) {
                    return NextResponse.json(
                        { error: "All team members must be registered users." },
                        { status: 400 }
                    );
                }

                // Check if any member is already registered
                const memberIds = members.map((member) => member.userId as string);
                const { data: existingRegs } = await supabase
                    .from("event_registrations")
                    .select("user_id")
                    .eq("event_id", eventId)
                    .in("user_id", memberIds)
                    .returns<{ user_id: string }[]>();

                if (existingRegs && existingRegs.length > 0) {
                    return NextResponse.json(
                        { error: "One or more team members are already registered for this event." },
                        { status: 400 }
                    );
                }

                const membersToInsert = members.map((member) => ({
                    team_id: teamId,
                    user_id: member.userId as string, // Link to user account
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    status: "pending", // Or 'accepted' if we assume adding them implies consent/notification
                }));

                const { error: membersError } = await supabase
                    .from("team_members")
                    .insert(membersToInsert);

                if (membersError) {
                    // Cleanup team? For now just warn
                    console.error("Failed to add members", membersError);
                    return NextResponse.json(
                        { error: "Failed to add team members: " + membersError.message },
                        { status: 500 }
                    );
                }
            }
        } else if (teamAction === "join") {
            if (!teamCode?.trim()) {
                return NextResponse.json(
                    { error: "Team code is required to join a team" },
                    { status: 400 }
                );
            }
            const { data: team } = await supabase
                .from("teams")
                .select("id")
                .eq("code", teamCode.trim())
                .eq("event_id", eventId)
                .single();

            if (!team) {
                return NextResponse.json({ error: "Invalid team code" }, { status: 400 });
            }
            teamId = team.id;

            // Check if user is already a member (invited) and update status?
            // For now, we assume joining via code adds them to the team directly or links them.
            // Ideally, we should check if they are in `team_members` and update `user_id`.
            // Simplified: We just link the registration to the team.
        }
    }

    // 5. Create Registration
    const { error: regError } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        team_id: teamId,
        form_response_id: formResponseId,
    });

    if (regError) {
        if (regError.code === "23505") {
            return NextResponse.json(
                { error: "You are already registered for this event" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Registration failed: " + regError.message },
            { status: 500 }
        );
    }

    // 6. Update Participant Count
    await supabase.rpc("increment_participant_count", { event_id: eventId });

    return NextResponse.json({ success: true, teamId });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id: eventId } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if registered
    const { data: registration } = await supabase
        .from("event_registrations")
        .select("id, team_id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

    if (!registration) {
        return NextResponse.json({ error: "Not registered" }, { status: 404 });
    }

    // 2. Handle Team Logic (if leader, delete team? if member, leave team?)
    // For now, if they are in a team, we just remove them from the team.
    // If they are the leader, we might need to delete the team or reassign.
    // Simplified: If team leader, warn or delete team.
    if (registration.team_id) {
        const { data: team } = await supabase
            .from("teams")
            .select("leader_id")
            .eq("id", registration.team_id)
            .single();

        if (team && team.leader_id === user.id) {
            // If leader unregisters, delete the whole team for now (simplest approach)
            // Or we could block it. Let's delete the team to avoid zombie teams.
            await supabase.from("teams").delete().eq("id", registration.team_id);
        } else {
            // Just remove member
            await supabase
                .from("team_members")
                .delete()
                .eq("team_id", registration.team_id)
                .eq("user_id", user.id);
        }
    }

    // 3. Delete Registration
    const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registration.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Update Participant Count
    await supabase.rpc("decrement_participant_count", { event_id: eventId });

    return NextResponse.json({ success: true });
}
