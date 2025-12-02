
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
    const userId = '313e84ad-6913-4e35-914d-d75550007e46';
    console.log(`Checking for User ID: ${userId}`);

    // Check users table (auth.users usually, but here we seem to be using public.users or syncing?)
    // The app uses `supabaseAdmin.from("users")`. Let's check that.
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (user) {
        console.log('✅ User found in public.users:', user);
    } else {
        console.log('❌ User NOT found in public.users. Error:', userError);
    }

    // Check profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        console.log('✅ Profile found in public.profiles:', profile);
    } else {
        console.log('❌ Profile NOT found in public.profiles. Error:', profileError);
    }
}

checkUser();
