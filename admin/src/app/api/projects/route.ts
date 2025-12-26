import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Super admins can see all projects, others can only see their own
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (profile.role !== 'super_admin' && profile.project_id) {
      query = supabase
        .from('projects')
        .select('*')
        .eq('id', profile.project_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
