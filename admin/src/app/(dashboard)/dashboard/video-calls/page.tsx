import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VideoCallList from './VideoCallList';

export default async function VideoCallsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createServiceClient();
  const isSuperAdmin = profile.role === 'super_admin';

  let query = supabase
    .from('video_sessions')
    .select('*, kiosk:kiosks(*, project:projects(*))')
    .order('started_at', { ascending: false })
    .limit(50);

  if (!isSuperAdmin) {
    query = query.eq('project_id', profile.project_id);
  }

  const { data: sessions } = await query;

  // Get waiting sessions (calls that need attention)
  let waitingQuery = supabase
    .from('video_sessions')
    .select('*, kiosk:kiosks(*, project:projects(*))')
    .eq('status', 'waiting')
    .order('started_at', { ascending: true });

  if (!isSuperAdmin) {
    waitingQuery = waitingQuery.eq('project_id', profile.project_id);
  }

  const { data: waitingSessions } = await waitingQuery;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">영상통화 관리</h1>

      <VideoCallList
        sessions={sessions || []}
        waitingSessions={waitingSessions || []}
        isSuperAdmin={isSuperAdmin}
        currentProfileId={profile.id}
      />
    </div>
  );
}
