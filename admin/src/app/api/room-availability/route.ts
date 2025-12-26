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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roomTypeId = searchParams.get('roomTypeId');

    const supabase = await createServiceClient();

    let query = supabase
      .from('room_availability')
      .select('*, room_type:room_types(*)')
      .order('date', { ascending: true });

    if (profile.role === 'super_admin') {
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    } else {
      query = query.eq('project_id', profile.project_id);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (roomTypeId) {
      query = query.eq('room_type_id', roomTypeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ availability: data });
  } catch (error) {
    console.error('Error fetching room availability:', error);
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

    const { projectId, roomTypeId, date, totalRooms, availableRooms, priceOverride } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !roomTypeId || !date) {
      return NextResponse.json({ error: 'Project ID, room type ID, and date are required' }, { status: 400 });
    }

    // Project admins can only create availability for their own project
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot create availability for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Use upsert to allow updating if already exists
    const { data, error } = await supabase
      .from('room_availability')
      .upsert({
        project_id: targetProjectId,
        room_type_id: roomTypeId,
        date,
        total_rooms: totalRooms ?? 0,
        available_rooms: availableRooms ?? totalRooms ?? 0,
        price_override: priceOverride || null,
      }, {
        onConflict: 'room_type_id,date',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, availability: data });
  } catch (error) {
    console.error('Error creating room availability:', error);
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

    const { id, totalRooms, availableRooms, priceOverride, projectId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Project admins can only update their own project's availability
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update availability for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (totalRooms !== undefined) updateData.total_rooms = totalRooms;
    if (availableRooms !== undefined) updateData.available_rooms = availableRooms;
    if (priceOverride !== undefined) updateData.price_override = priceOverride;

    const { data, error } = await supabase
      .from('room_availability')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, availability: data });
  } catch (error) {
    console.error('Error updating room availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bulk update availability for a date range
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, roomTypeId, startDate, endDate, totalRooms, priceOverride } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !roomTypeId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Project ID, room type ID, start date, and end date are required' }, { status: 400 });
    }

    // Project admins can only update their own project's availability
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update availability for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Generate dates between start and end
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Upsert availability for each date
    const records = dates.map(date => ({
      project_id: targetProjectId,
      room_type_id: roomTypeId,
      date,
      total_rooms: totalRooms ?? 0,
      available_rooms: totalRooms ?? 0,
      price_override: priceOverride || null,
    }));

    const { data, error } = await supabase
      .from('room_availability')
      .upsert(records, {
        onConflict: 'room_type_id,date',
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, availability: data });
  } catch (error) {
    console.error('Error bulk updating room availability:', error);
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

    // Project admins can only delete their own project's availability
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot delete availability for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('room_availability')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
