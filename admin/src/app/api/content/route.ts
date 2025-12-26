import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, contentKey, contentValue, language = 'ko' } = await request.json();

    // Project admins can only modify their own project's content
    if (profile.role === 'project_admin' && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot modify content for other projects' }, { status: 403 });
    }

    if (!projectId || !contentKey || !contentValue) {
      return NextResponse.json({ error: 'Project ID, content key, and value are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('kiosk_content')
      .insert({
        project_id: projectId,
        content_key: contentKey,
        content_value: contentValue,
        language,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, content: data });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, contentValue, projectId } = await request.json();

    // Project admins can only modify their own project's content
    if (profile.role === 'project_admin' && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot modify content for other projects' }, { status: 403 });
    }

    if (!id || !contentValue) {
      return NextResponse.json({ error: 'ID and content value are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('kiosk_content')
      .update({ content_value: contentValue })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, projectId } = await request.json();

    // Project admins can only delete their own project's content
    if (profile.role === 'project_admin' && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot delete content for other projects' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('kiosk_content')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
