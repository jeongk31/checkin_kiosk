import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins and project admins can logout kiosks
    if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { kioskId } = await request.json();

    if (!kioskId) {
      return NextResponse.json({ error: 'Kiosk ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Get the kiosk to verify permissions
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select('*, profile:profiles(*)')
      .eq('id', kioskId)
      .single();

    if (kioskError || !kiosk) {
      return NextResponse.json({ error: 'Kiosk not found' }, { status: 404 });
    }

    // Project admins can only logout kiosks from their own project
    if (profile.role === 'project_admin' && kiosk.project_id !== profile.project_id) {
      return NextResponse.json({ error: 'Cannot logout kiosks from other projects' }, { status: 403 });
    }

    // Send logout signal via Supabase Realtime broadcast
    const channel = supabase.channel(`kiosk-control-${kioskId}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'logout',
      payload: { timestamp: new Date().toISOString() },
    });
    await supabase.removeChannel(channel);

    // Update kiosk status to offline
    await supabase
      .from('kiosks')
      .update({
        status: 'offline',
        last_seen: new Date().toISOString()
      })
      .eq('id', kioskId);

    // If the kiosk has an associated profile, sign them out by clearing their session
    // (The kiosk will handle its own logout on the client side upon receiving the signal)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out kiosk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
