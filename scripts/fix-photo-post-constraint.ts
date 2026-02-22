import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPhotoPostConstraint() {
    console.log('🔧 Fixing photo post constraint...');

    const sql = `
    -- Drop the existing constraint
    alter table public.posts
      drop constraint if exists posts_body_check;

    -- Add new constraint that allows empty body if attachments exist
    alter table public.posts
      add constraint posts_body_check
        check (
          -- Allow empty body if attachments exist
          (length(trim(body)) = 0 and attachments is not null and jsonb_array_length(attachments) > 0)
          -- OR require body to be between 1 and 5000 characters
          or (length(trim(body)) between 1 and 5000)
        );
  `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }

    console.log('✅ Photo post constraint fixed successfully!');
    console.log('   You can now post photos without text content.');
}

fixPhotoPostConstraint();
