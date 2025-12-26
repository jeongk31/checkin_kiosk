'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Kiosk } from '@/types/database';

interface KioskActionsProps {
  kiosk: Kiosk;
}

export default function KioskActions({ kiosk }: KioskActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('kiosks').delete().eq('id', kiosk.id);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/dashboard/kiosks/${kiosk.id}`}
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        상세보기
      </Link>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        삭제
      </button>
    </div>
  );
}
