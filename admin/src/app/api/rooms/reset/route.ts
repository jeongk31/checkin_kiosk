import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * POST /api/rooms/reset
 *
 * Daily reset - deletes all rooms and updates reservations
 * - Deletes ALL rooms for the project
 * - Updates all 'checked_in' reservations to 'checked_out'
 *
 * This should be called by a cron job at the configured reset time
 */
export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    // Allow cron jobs with API key or authenticated admins
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronJob = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!profile && !isCronJob) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile && profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId } = await request.json();

    // For cron jobs, projectId is required. For admins, use their project or the provided one.
    const targetProjectId = profile?.role === 'super_admin'
      ? projectId
      : (profile?.project_id || projectId);

    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Count rooms before deletion
    const { data: existingRooms, error: countError } = await supabase
      .from('rooms')
      .select('id')
      .eq('project_id', targetProjectId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    const roomCount = existingRooms?.length || 0;

    // 2. Delete ALL rooms for this project
    const { error: deleteRoomsError } = await supabase
      .from('rooms')
      .delete()
      .eq('project_id', targetProjectId);

    if (deleteRoomsError) {
      console.error('Error deleting rooms:', deleteRoomsError);
      return NextResponse.json({ error: deleteRoomsError.message }, { status: 400 });
    }

    // 3. Update all checked_in reservations to checked_out
    const { data: checkedOutReservations, error: reservationsError } = await supabase
      .from('reservations')
      .update({ status: 'checked_out' })
      .eq('project_id', targetProjectId)
      .eq('status', 'checked_in')
      .lte('check_out_date', today)
      .select();

    if (reservationsError) {
      console.error('Error updating reservations:', reservationsError);
    }

    const checkoutCount = checkedOutReservations?.length || 0;

    return NextResponse.json({
      success: true,
      message: `리셋 완료: ${roomCount}개 객실 삭제, ${checkoutCount}개 예약 체크아웃 처리`,
      deletedRooms: roomCount,
      checkedOutReservations: checkoutCount,
    });
  } catch (error) {
    console.error('Error resetting rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
