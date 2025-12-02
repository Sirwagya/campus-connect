import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (client) {
        return client
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables:', {
            url: !!supabaseUrl,
            key: !!supabaseKey
        })
        throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    client = createBrowserClient(supabaseUrl, supabaseKey)

    return client
}
