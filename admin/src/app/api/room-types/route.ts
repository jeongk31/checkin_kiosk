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

    const supabase = await createServiceClient();

    let query = supabase
      .from('room_types')
      .select('*')
      .order('display_order', { ascending: true });

    if (profile.role === 'super_admin') {
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    } else {
      query = query.eq('project_id', profile.project_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ roomTypes: data });
  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, name, description, basePrice, maxGuests, imageUrl } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !name) {
      return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 });
    }

    // Project admins can only create room types for their own project
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot create room types for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Get the highest display_order for this project
    const { data: existingRoomTypes } = await supabase
      .from('room_types')
      .select('display_order')
      .eq('project_id', targetProjectId)
      .order('display_order', { ascending: false })
      .limit(1);

    const displayOrder = existingRoomTypes && existingRoomTypes.length > 0
      ? existingRoomTypes[0].display_order + 1
      : 0;

    const { data, error } = await supabase
      .from('room_types')
      .insert({
        project_id: targetProjectId,
        name,
        description: description || null,
        base_price: basePrice || 0,
        max_guests: maxGuests || 2,
        display_order: displayOrder,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, roomType: data });
  } catch (error) {
    console.error('Error creating room type:', error);
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

    const { id, name, description, basePrice, maxGuests, isActive, displayOrder, projectId, imageUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Project admins can only update their own project's room types
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update room types for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.base_price = basePrice;
    if (maxGuests !== undefined) updateData.max_guests = maxGuests;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (displayOrder !== undefined) updateData.display_order = displayOrder;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    const { data, error } = await supabase
      .from('room_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, roomType: data });
  } catch (error) {
    console.error('Error updating room type:', error);
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

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Project admins can only delete their own project's room types
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot delete room types for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('room_types')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
