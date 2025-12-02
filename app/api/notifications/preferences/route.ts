import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
  email_mentions: z.boolean().optional(),
  email_follows: z.boolean().optional(),
  email_comments: z.boolean().optional(),
  email_events: z.boolean().optional(),
  email_digest: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  push_mentions: z.boolean().optional(),
  push_messages: z.boolean().optional(),
  push_events: z.boolean().optional(),
  quiet_hours_start: z.string().nullable().optional(),
  quiet_hours_end: z.string().nullable().optional(),
});

// GET - Fetch user's notification preferences
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no preferences exist
    const defaultPreferences = {
      user_id: session.user.id,
      email_mentions: true,
      email_follows: true,
      email_comments: true,
      email_events: true,
      email_digest: false,
      push_enabled: true,
      push_mentions: true,
      push_messages: true,
      push_events: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };

    return NextResponse.json({
      data: data || defaultPreferences,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = notificationPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid preferences', 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    const preferences = parsed.data;

    // Upsert preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
