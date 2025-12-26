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
    const roomTypeId = searchParams.get('roomTypeId');
    const status = searchParams.get('status');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const supabase = await createServiceClient();

    let query = supabase
      .from('rooms')
      .select('*, room_type:room_types(*)')
      .order('room_number', { ascending: true });

    if (profile.role === 'super_admin') {
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    } else {
      query = query.eq('project_id', profile.project_id);
    }

    if (roomTypeId) {
      query = query.eq('room_type_id', roomTypeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (availableOnly) {
      query = query.eq('status', 'available').eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ rooms: data });
  } catch (error) {
    console.error('Error fetching rooms:', error);
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

    const {
      projectId,
      roomTypeId,
      roomNumber,
      accessType,
      roomPassword,
      keyBoxNumber,
      keyBoxPassword,
      floor,
      notes,
    } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !roomNumber) {
      return NextResponse.json({ error: 'Project ID and room number are required' }, { status: 400 });
    }

    // Validate access type fields
    if (accessType === 'password' && !roomPassword) {
      return NextResponse.json({ error: '비밀번호를 입력해주세요' }, { status: 400 });
    }

    if (accessType === 'card' && (!keyBoxNumber || !keyBoxPassword)) {
      return NextResponse.json({ error: '키 박스 번호와 비밀번호를 입력해주세요' }, { status: 400 });
    }

    // Project admins can only create rooms for their own project
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot create rooms for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        project_id: targetProjectId,
        room_type_id: roomTypeId || null,
        room_number: roomNumber,
        access_type: accessType || 'card',
        room_password: accessType === 'password' ? roomPassword : null,
        key_box_number: accessType === 'card' ? keyBoxNumber : null,
        key_box_password: accessType === 'card' ? keyBoxPassword : null,
        floor: floor || null,
        notes: notes || null,
        status: 'available',
        is_active: true,
      })
      .select('*, room_type:room_types(*)')
      .single();

    if (error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ error: '이미 존재하는 객실 번호입니다' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, room: data });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin' && profile.role !== 'kiosk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      id,
      projectId,
      roomTypeId,
      roomNumber,
      accessType,
      roomPassword,
      keyBoxNumber,
      keyBoxPassword,
      floor,
      notes,
      status,
      isActive,
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Project admins can only update their own project's rooms
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update rooms for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (roomTypeId !== undefined) updateData.room_type_id = roomTypeId;
    if (roomNumber !== undefined) updateData.room_number = roomNumber;
    if (accessType !== undefined) {
      updateData.access_type = accessType;
      if (accessType === 'password') {
        updateData.room_password = roomPassword || null;
        updateData.key_box_number = null;
        updateData.key_box_password = null;
      } else {
        updateData.room_password = null;
        updateData.key_box_number = keyBoxNumber || null;
        updateData.key_box_password = keyBoxPassword || null;
      }
    } else {
      if (roomPassword !== undefined) updateData.room_password = roomPassword;
      if (keyBoxNumber !== undefined) updateData.key_box_number = keyBoxNumber;
      if (keyBoxPassword !== undefined) updateData.key_box_password = keyBoxPassword;
    }
    if (floor !== undefined) updateData.floor = floor;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select('*, room_type:room_types(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, room: data });
  } catch (error) {
    console.error('Error updating room:', error);
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

    // Project admins can only delete their own project's rooms
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot delete rooms for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
