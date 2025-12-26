import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KioskApp from './KioskApp';

interface KioskPageProps {
  searchParams: Promise<{
    payment?: string;
    txn?: string;
    approval?: string;
    error?: string;
    message?: string;
  }>;
}

export default async function KioskPage({ searchParams }: KioskPageProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  // Only kiosk users can access this page
  if (profile.role !== 'kiosk') {
    redirect('/dashboard');
  }

  // Get the kiosk associated with this profile (using service client to bypass RLS)
  const supabase = await createServiceClient();
  const { data: kiosk, error } = await supabase
    .from('kiosks')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  if (error || !kiosk) {
    console.error('Kiosk not found for profile:', profile.id, error);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">키오스크 오류</h1>
          <p className="text-gray-600 mb-4">
            이 계정에 연결된 키오스크를 찾을 수 없습니다.
          </p>
          <p className="text-sm text-gray-500">
            프로필 ID: {profile.id}
          </p>
          <a
            href="/api/auth/logout"
            className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            로그아웃
          </a>
        </div>
      </div>
    );
  }

  // Fetch content for this kiosk's project
  const { data: contentData } = await supabase
    .from('kiosk_content')
    .select('content_key, content_value')
    .eq('project_id', kiosk.project_id);

  // Convert to a key-value map
  const content: Record<string, string> = {};
  (contentData || []).forEach((item) => {
    content[item.content_key] = item.content_value;
  });

  // Build payment result from URL params (returned from EasyCheck app)
  const paymentResult = params.payment ? {
    status: params.payment as 'success' | 'failed',
    transactionNo: params.txn,
    approvalNum: params.approval,
    errorCode: params.error,
    errorMessage: params.message,
  } : undefined;

  return <KioskApp kiosk={kiosk} content={content} paymentResult={paymentResult} />;
}
