import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AccountActions from './AccountActions';

export default async function AccountsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createServiceClient();
  const isSuperAdmin = profile.role === 'super_admin';

  let query = supabase
    .from('profiles')
    .select('*, project:projects(*)')
    .order('created_at', { ascending: false });

  // Project admins can only see accounts in their project
  if (!isSuperAdmin) {
    query = query.eq('project_id', profile.project_id);
  }

  const { data: accounts } = await query;

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    project_admin: 'Project Admin',
    kiosk: 'Kiosk',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">계정 관리</h1>
        <Link
          href="/dashboard/accounts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 새 계정
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              {isSuperAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts?.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{account.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {account.full_name || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      account.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : account.role === 'project_admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {roleLabels[account.role]}
                  </span>
                </td>
                {isSuperAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.project?.name || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      account.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {account.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <AccountActions
                    account={account}
                    currentUserRole={profile.role}
                  />
                </td>
              </tr>
            ))}
            {(!accounts || accounts.length === 0) && (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 6 : 5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  등록된 계정이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
