import { createServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type AuditLogInsert = Database['public']['Tables']['audit_log']['Insert'];

type AuditAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'profile.update'
  | 'post.create'
  | 'post.delete'
  | 'comment.create'
  | 'comment.delete'
  | 'space.create'
  | 'space.join'
  | 'space.leave'
  | 'space.update'
  | 'event.create'
  | 'event.register'
  | 'event.cancel'
  | 'follow.create'
  | 'follow.delete'
  | 'settings.update'
  | 'account.export_request'
  | 'account.delete_request'
  | 'admin.action';

interface AuditLogEntry {
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event to the database
 * Should be called from API routes after successful operations
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('Audit log called without session');
      return;
    }

    const insertData: AuditLogInsert = {
      user_id: session.user.id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      old_values: (entry.old_values as AuditLogInsert['old_values']) || null,
      new_values: (entry.new_values as AuditLogInsert['new_values']) || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    };

    await supabase.from('audit_log').insert(insertData);
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Helper to extract IP and User-Agent from request headers
 */
export function extractRequestInfo(request: Request): { ip_address?: string; user_agent?: string } {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip_address = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
  const user_agent = request.headers.get('user-agent') || undefined;
  
  return { ip_address, user_agent };
}

/**
 * Convenience wrapper that logs an audit event with request info
 */
export async function auditLog(
  request: Request,
  action: AuditAction,
  options?: {
    resource_type?: string;
    resource_id?: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
  }
): Promise<void> {
  const { ip_address, user_agent } = extractRequestInfo(request);
  
  await logAuditEvent({
    action,
    resource_type: options?.resource_type || action.split('.')[0],
    resource_id: options?.resource_id,
    old_values: options?.old_values,
    new_values: options?.new_values,
    ip_address,
    user_agent,
  });
}
