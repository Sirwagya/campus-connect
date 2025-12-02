import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { auditLog } from '@/lib/audit';

// POST - Request data export
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for existing pending export request
    const { data: existingRequest } = await supabase
      .from('data_export_requests')
      .select('id, status, created_at')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Export already in progress',
        request: existingRequest 
      }, { status: 409 });
    }

    // Create export request
    const { data: exportRequest, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: session.user.id,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating export request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the audit event
    await auditLog(request, 'account.export_request', {
      resource_type: 'data_export',
      resource_id: exportRequest.id,
    });

    // In a real implementation, you would:
    // 1. Queue a background job to generate the export
    // 2. Send an email when the export is ready
    // For now, we'll just return the request

    return NextResponse.json({ 
      message: 'Export request submitted. You will receive an email when your data is ready.',
      request: exportRequest 
    });
  } catch (error) {
    console.error('Error in POST /api/account/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check export status
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching export requests:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Error in GET /api/account/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
