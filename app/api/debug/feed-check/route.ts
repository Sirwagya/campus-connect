import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type UserIdRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id">;
type ColumnInfo = Record<string, unknown>;

type FeedCheckResults = {
    columns_check?: {
        columns: ColumnInfo[] | null;
        columns_error: PostgrestError | null;
        sample_data: PostRow[] | null;
        sample_error: PostgrestError | null;
    };
    insert_check?:
        | {
              success: true;
              data: PostRow;
              error: null;
          }
        | {
              success: false;
              data?: PostRow | null;
              error?: PostgrestError | string | null;
          };
    unexpected_error?: string;
};

export async function GET() {
    const results: FeedCheckResults = {};

    try {
        // 1. Check Columns
        // Note: get_columns RPC may not exist - this is a debug route
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: columnsData, error: colError } = await (supabaseAdmin as any).rpc(
            "get_columns",
            { table_name: "posts" }
        );

        const columns = columnsData as ColumnInfo[] | null;

        // If RPC doesn't exist (it likely doesn't), use a raw query if possible, 
        // but supabase-js doesn't support raw queries easily without RPC.
        // Let's try to just select one row and see the structure.
        const { data: sample, error: sampleError } = await supabaseAdmin
            .from("posts")
            .select("*")
            .limit(1);

        results.columns_check = {
            columns,
            columns_error: colError,
            sample_data: sample as PostRow[] | null,
            sample_error: sampleError,
        };

        // 2. Try a test insert (using a random UUID if we can, or just fail auth if RLS is on? 
        // We are using supabaseAdmin so RLS is bypassed).
        // We need a valid user_id though because of the foreign key constraint.

        // Fetch a user
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("id")
            .limit(1)
            .single<UserIdRow>();

        if (user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: insertData, error: insertError } = await (supabaseAdmin as any)
                .from("posts")
                .insert({
                    user_id: user.id,
                    body: `Debug post ${new Date().toISOString()}`,
                    attachments: [],
                })
                .select()
                .single();

            if (!insertError && insertData) {
                results.insert_check = {
                    success: true,
                    data: insertData as PostRow,
                    error: null,
                };
            } else {
                results.insert_check = {
                    success: false,
                    data: insertData as PostRow | null,
                    error: insertError,
                };
            }
        } else {
            results.insert_check = {
                success: false,
                error: "No users found to test insert",
            };
        }

    } catch (error: unknown) {
        results.unexpected_error =
            error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json(results);
}
