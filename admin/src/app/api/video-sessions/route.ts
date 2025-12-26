import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status, staffUserId, endedAt } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = { status };

    if (staffUserId !== undefined) {
      updateData.staff_user_id = staffUserId;
    }

    if (endedAt !== undefined) {
      updateData.ended_at = endedAt;
    }

    const { error } = await supabase
      .from('video_sessions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating video session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
