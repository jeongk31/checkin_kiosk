import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const role = searchParams.get('role');

    const supabase = await createServiceClient();

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('email');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Project admins can only see profiles in their project
    if (profile.role === 'project_admin') {
      query = query.eq('project_id', profile.project_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profiles: data });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
