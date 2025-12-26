'use client';

import { useRouter } from 'next/navigation';
import { Profile, UserRole } from '@/types/database';

interface AccountActionsProps {
  account: Profile;
  currentUserRole: UserRole;
}

export default function AccountActions({
  account,
  currentUserRole,
}: AccountActionsProps) {
  const router = useRouter();

  // Only super admins can modify super admins
  const canModify =
    currentUserRole === 'super_admin' ||
    (currentUserRole === 'project_admin' && account.role === 'kiosk');

  const handleToggleActive = async () => {
    if (!canModify) return;

    try {
      const response = await fetch('/api/accounts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          isActive: !account.is_active,
          accountRole: account.role,
          accountProjectId: account.project_id,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDelete = async () => {
    if (!canModify) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const response = await fetch('/api/accounts/update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          accountRole: account.role,
          accountProjectId: account.project_id,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (!canModify) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggleActive}
        className="text-yellow-600 hover:text-yellow-800"
      >
        {account.is_active ? '비활성화' : '활성화'}
      </button>
      <button onClick={handleDelete} className="text-red-600 hover:text-red-800">
        삭제
      </button>
    </div>
  );
}
