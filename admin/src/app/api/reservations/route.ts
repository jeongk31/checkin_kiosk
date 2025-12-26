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
    const checkInDate = searchParams.get('checkInDate');
    const beforeDate = searchParams.get('beforeDate');
    const status = searchParams.get('status');
    const reservationNumber = searchParams.get('reservationNumber');
    const limit = searchParams.get('limit');

    const supabase = await createServiceClient();

    let query = supabase
      .from('reservations')
      .select('*, room_type:room_types(*)')
      .order('check_in_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (profile.role === 'super_admin') {
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    } else {
      query = query.eq('project_id', profile.project_id);
    }

    if (checkInDate) {
      query = query.eq('check_in_date', checkInDate);
    }

    if (beforeDate) {
      query = query.lt('check_in_date', beforeDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (reservationNumber) {
      query = query.ilike('reservation_number', `%${reservationNumber}%`);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reservations: data });
  } catch (error) {
    console.error('Error fetching reservations:', error);
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
      reservationNumber,
      guestName,
      guestPhone,
      guestEmail,
      guestCount,
      checkInDate,
      checkOutDate,
      roomNumber,
      source,
      notes,
      totalPrice,
      status: inputStatus,
    } = await request.json();

    const targetProjectId = profile.role === 'super_admin' ? projectId : profile.project_id;

    if (!targetProjectId || !reservationNumber || !checkInDate || !checkOutDate) {
      return NextResponse.json({
        error: 'Project ID, reservation number, check-in date, and check-out date are required'
      }, { status: 400 });
    }

    // Project admins can only create reservations for their own project
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot create reservations for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        project_id: targetProjectId,
        room_type_id: roomTypeId || null,
        reservation_number: reservationNumber,
        guest_name: guestName || null,
        guest_phone: guestPhone || null,
        guest_email: guestEmail || null,
        guest_count: guestCount || 1,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        room_number: roomNumber || null,
        source: source || null,
        notes: notes || null,
        total_price: totalPrice || null,
        status: inputStatus || 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ error: '이미 존재하는 예약번호입니다' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reservation: data });
  } catch (error) {
    console.error('Error creating reservation:', error);
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

    const {
      id,
      projectId,
      roomTypeId,
      reservationNumber,
      guestName,
      guestPhone,
      guestEmail,
      guestCount,
      checkInDate,
      checkOutDate,
      roomNumber,
      status,
      source,
      notes,
      totalPrice,
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Project admins can only update their own project's reservations
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot update reservations for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (roomTypeId !== undefined) updateData.room_type_id = roomTypeId;
    if (reservationNumber !== undefined) updateData.reservation_number = reservationNumber;
    if (guestName !== undefined) updateData.guest_name = guestName;
    if (guestPhone !== undefined) updateData.guest_phone = guestPhone;
    if (guestEmail !== undefined) updateData.guest_email = guestEmail;
    if (guestCount !== undefined) updateData.guest_count = guestCount;
    if (checkInDate !== undefined) updateData.check_in_date = checkInDate;
    if (checkOutDate !== undefined) updateData.check_out_date = checkOutDate;
    if (roomNumber !== undefined) updateData.room_number = roomNumber;
    if (status !== undefined) updateData.status = status;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (totalPrice !== undefined) updateData.total_price = totalPrice;

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reservation: data });
  } catch (error) {
    console.error('Error updating reservation:', error);
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

    // Project admins can only delete their own project's reservations
    if (profile.role === 'project_admin' && projectId && projectId !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot delete reservations for other projects' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
