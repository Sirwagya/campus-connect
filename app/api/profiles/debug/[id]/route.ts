
import { NextRequest, NextResponse } from "next/server";
import { getUnifiedProfile } from "@/lib/profile/service";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const logs: string[] = [];

    const log = (msg: string, data?: any) => {
        const entry = `[${new Date().toISOString()}] ${msg} ${data ? JSON.stringify(data) : ''}`;
        console.log(entry);
        logs.push(entry);
    };

    try {
        log(`Fetching unified profile for ID: ${id}`);

        // Direct check with admin client
        const { data: directUser, error: directError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        log("Direct Admin User Check:", { found: !!directUser, error: directError });

        const profile = await getUnifiedProfile(id);

        log("getUnifiedProfile Result:", { found: !!profile });

        return NextResponse.json({
            id,
            profile,
            directUser,
            logs
        });
    } catch (error: any) {
        log("Exception:", error.message);
        return NextResponse.json({
            id,
            error: error.message,
            stack: error.stack,
            logs
        }, { status: 500 });
    }
}
