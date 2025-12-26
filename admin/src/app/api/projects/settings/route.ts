import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Update project settings (like daily reset time)
export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, settings } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Project admins can only update their own project
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update settings for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Get current settings
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('settings')
      .eq('id', targetProjectId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Merge settings
    const mergedSettings = {
      ...(currentProject?.settings || {}),
      ...settings,
    };

    const { data, error } = await supabase
      .from('projects')
      .update({ settings: mergedSettings })
      .eq('id', targetProjectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
