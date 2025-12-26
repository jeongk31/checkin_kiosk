import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SessionsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createServiceClient();
  const isSuperAdmin = profile.role === 'super_admin';

  let query = supabase
    .from('checkin_sessions')
    .select('*, kiosk:kiosks(*, project:projects(*))')
    .order('started_at', { ascending: false })
    .limit(100);

  if (!isSuperAdmin) {
    query = query.eq('project_id', profile.project_id);
  }

  const { data: sessions } = await query;

  const statusLabels: Record<string, { label: string; class: string }> = {
    in_progress: { label: '진행중', class: 'bg-blue-100 text-blue-800' },
    completed: { label: '완료', class: 'bg-green-100 text-green-800' },
    abandoned: { label: '중단', class: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">체크인 기록</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                키오스크
              </th>
              {isSuperAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  프로젝트
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                인원
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                객실
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                시작 시간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                완료 시간
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions?.map((session) => {
              const status = statusLabels[session.status] || statusLabels.in_progress;
              return (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(session.kiosk as { name?: string })?.name || '-'}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(session.kiosk as { project?: { name?: string } })?.project?.name || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{session.guest_phone || '-'}</div>
                    {session.guest_email && (
                      <div className="text-xs text-gray-500">{session.guest_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.guest_count}명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {session.room_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.started_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleString('ko-KR')
                      : '-'}
                  </td>
                </tr>
              );
            })}
            {(!sessions || sessions.length === 0) && (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 8 : 7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  체크인 기록이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
