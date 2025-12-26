import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can modify projects
    if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('projects')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can delete projects
    if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
