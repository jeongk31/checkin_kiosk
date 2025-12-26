import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Generate a unique reservation number for walk-in
function generateWalkinReservationNumber(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `WI-${date}-${time}${random}`;
}

// Assign an available room to a guest (used by kiosk during check-in)
export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, roomTypeId, guestName, guestCount, checkOutDate, reservationId, reservationNumber: existingReservationNumber } = await request.json();

    const targetProjectId = profile.project_id || projectId;

    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let room: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existingReservation: any = null;

    // If a reservation ID or number is provided, check for a pre-assigned reserved room
    if (reservationId || existingReservationNumber) {
      // Look up the existing reservation
      let reservationQuery = supabase
        .from('reservations')
        .select('*')
        .eq('project_id', targetProjectId);

      if (reservationId) {
        reservationQuery = reservationQuery.eq('id', reservationId);
      } else {
        reservationQuery = reservationQuery.eq('reservation_number', existingReservationNumber);
      }

      const { data: reservationData } = await reservationQuery.single();

      if (reservationData && reservationData.room_number) {
        existingReservation = reservationData;

        // Check if this room exists and is reserved for this reservation
        const { data: reservedRoom } = await supabase
          .from('rooms')
          .select('*, room_type:room_types(*)')
          .eq('project_id', targetProjectId)
          .eq('room_number', reservationData.room_number)
          .eq('status', 'reserved')
          .eq('is_active', true)
          .single();

        if (reservedRoom) {
          room = reservedRoom;
        }
      }
    }

    // If no reserved room found, find an available room
    if (!room) {
      let query = supabase
        .from('rooms')
        .select('*, room_type:room_types(*)')
        .eq('project_id', targetProjectId)
        .eq('status', 'available')
        .eq('is_active', true)
        .order('room_number', { ascending: true })
        .limit(1);

      if (roomTypeId) {
        query = query.eq('room_type_id', roomTypeId);
      }

      const { data: rooms, error: fetchError } = await query;

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 400 });
      }

      if (!rooms || rooms.length === 0) {
        return NextResponse.json({
          success: false,
          error: '현재 사용 가능한 객실이 없습니다',
        });
      }

      room = rooms[0];
    }

    // Mark the room as occupied
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', room.id)
      .select('*, room_type:room_types(*)')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reservation: any = null;

    // If there's an existing reservation, update it to checked_in
    if (existingReservation) {
      const { data: updatedReservation, error: updateReservationError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          room_number: updatedRoom.room_number,
        })
        .eq('id', existingReservation.id)
        .select()
        .single();

      if (!updateReservationError) {
        reservation = updatedReservation;
      } else {
        console.error('Error updating reservation:', updateReservationError);
      }
    } else {
      // Create a new reservation record for this walk-in booking
      const newReservationNumber = generateWalkinReservationNumber();
      const checkInDate = today;
      const finalCheckOutDate = checkOutDate || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

      const { data: newReservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          project_id: targetProjectId,
          room_type_id: updatedRoom.room_type_id,
          reservation_number: newReservationNumber,
          guest_name: guestName || null,
          guest_count: guestCount || 1,
          check_in_date: checkInDate,
          check_out_date: finalCheckOutDate,
          room_number: updatedRoom.room_number,
          source: 'kiosk_walkin',
          status: 'checked_in',
        })
        .select()
        .single();

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        // Room was assigned but reservation failed - still return success with warning
      } else {
        reservation = newReservation;
      }
    }

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom.id,
        roomNumber: updatedRoom.room_number,
        accessType: updatedRoom.access_type,
        roomPassword: updatedRoom.room_password,
        keyBoxNumber: updatedRoom.key_box_number,
        keyBoxPassword: updatedRoom.key_box_password,
        floor: updatedRoom.floor,
        roomType: updatedRoom.room_type,
      },
      reservation: reservation || null,
    });
  } catch (error) {
    console.error('Error assigning room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
