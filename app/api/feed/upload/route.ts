import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type/size
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase
            .storage
            .from('post-attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('[Upload] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('post-attachments')
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: publicUrl,
            type: 'image',
            path: data.path
        });

    } catch (error: any) {
        console.error('[Upload] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
