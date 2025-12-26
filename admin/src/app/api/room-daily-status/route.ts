import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Get room daily status for a specific date
export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get all rooms with their daily status for the given date
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*, room_type:room_types(*)')
      .eq('project_id', targetProjectId)
      .eq('is_active', true)
      .order('room_number');

    if (roomsError) {
      return NextResponse.json({ error: roomsError.message }, { status: 400 });
    }

    // Get daily status for the date
    const { data: statusData, error: statusError } = await supabase
      .from('room_daily_status')
      .select('*')
      .eq('project_id', targetProjectId)
      .eq('date', date);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 400 });
    }

    // Create a map of room_id -> status
    const statusMap: Record<string, boolean> = {};
    (statusData || []).forEach((status: { room_id: string; is_available: boolean }) => {
      statusMap[status.room_id] = status.is_available;
    });

    // Combine rooms with their status
    const roomsWithStatus = (rooms || []).map((room: { id: string }) => ({
      ...room,
      dailyStatus: statusMap[room.id] ?? false, // Default to not available
    }));

    return NextResponse.json({ rooms: roomsWithStatus });
  } catch (error) {
    console.error('Error fetching room daily status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update room daily status (upsert)
export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, roomId, date, isAvailable } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !roomId || !date) {
      return NextResponse.json({ error: 'Project ID, room ID, and date are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('room_daily_status')
      .upsert({
        room_id: roomId,
        project_id: targetProjectId,
        date,
        is_available: isAvailable,
      }, {
        onConflict: 'room_id,date',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: data });
  } catch (error) {
    console.error('Error updating room daily status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bulk update room daily status
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, updates } = await request.json();
    // updates is an array of { roomId, date, isAvailable }

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Project ID and updates array are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const records = updates.map((u: { roomId: string; date: string; isAvailable: boolean }) => ({
      room_id: u.roomId,
      project_id: targetProjectId,
      date: u.date,
      is_available: u.isAvailable,
    }));

    const { data, error } = await supabase
      .from('room_daily_status')
      .upsert(records, {
        onConflict: 'room_id,date',
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, statuses: data });
  } catch (error) {
    console.error('Error bulk updating room daily status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
