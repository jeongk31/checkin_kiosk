import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, isActive, accountRole, accountProjectId } = await request.json();

    // Check permissions
    if (profile.role === 'project_admin') {
      // Project admins can only modify kiosk accounts in their project
      if (accountRole !== 'kiosk') {
        return NextResponse.json({ error: 'Project admins can only modify kiosk accounts' }, { status: 403 });
      }
      if (accountProjectId !== profile.project_id) {
        return NextResponse.json({ error: 'Cannot modify accounts from other projects' }, { status: 403 });
      }
    } else if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, accountRole, accountProjectId } = await request.json();

    // Check permissions
    if (profile.role === 'project_admin') {
      if (accountRole !== 'kiosk') {
        return NextResponse.json({ error: 'Project admins can only delete kiosk accounts' }, { status: 403 });
      }
      if (accountProjectId !== profile.project_id) {
        return NextResponse.json({ error: 'Cannot delete accounts from other projects' }, { status: 403 });
      }
    } else if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
