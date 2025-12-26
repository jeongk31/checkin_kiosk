import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Get a single project by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Project admins can only view their own project
    if (profile.role === 'project_admin' && id !== profile.project_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
