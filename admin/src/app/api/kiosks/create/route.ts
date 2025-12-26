import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins and project admins can create kiosks
    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, projectId, location, profileId } = await request.json();

    // Project admins can only create kiosks for their own project
    if (profile.role === 'project_admin' && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot create kiosks for other projects' }, { status: 403 });
    }

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Name and project are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('kiosks')
      .insert({
        name,
        project_id: projectId,
        location: location || null,
        profile_id: profileId || null,
        status: 'offline',
        current_screen: 'start',
        settings: {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, kiosk: data });
  } catch (error) {
    console.error('Error creating kiosk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
