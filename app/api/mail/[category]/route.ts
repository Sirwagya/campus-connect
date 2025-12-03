import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { MailCategory } from "@/types/mail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { category } = await params;

        // Validate category
        const validCategories: MailCategory[] = ['inbox', 'sent', 'draft', 'spam', 'trash'];
        if (!validCategories.includes(category as MailCategory)) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        const { data: mails, error } = await supabase
            .from("mails")
            .select("*")
            .eq("user_id", user.id)
            .eq("category", category as MailCategory)
            .order("timestamp", { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ mails });
    } catch (error: any) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
