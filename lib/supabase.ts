"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

// Singleton pattern to prevent multiple client instances
let supabaseInstance: TypedClient | null = null;

export function getSupabase(): TypedClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

// Legacy export for backward compatibility - uses singleton
export const supabase = (() => {
  try {
    return getSupabase();
  } catch {
    // Return a lazy getter that will throw on access if env vars are missing
    return null as unknown as TypedClient;
  }
})();
