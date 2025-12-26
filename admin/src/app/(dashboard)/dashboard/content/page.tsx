import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ContentEditor from './ContentEditor';

export default async function ContentPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  // Only project admins and super admins with a project can edit content
  const projectId = profile.project_id;
  if (!projectId && profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const supabase = await createServiceClient();

  // For super admin, get all projects to select from
  let projects = null;
  if (profile.role === 'super_admin') {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('name');
    projects = data;
  }

  // Get content for the current project (or first project for super admin)
  let content = null;
  const targetProjectId = projectId || projects?.[0]?.id;

  if (targetProjectId) {
    const { data } = await supabase
      .from('kiosk_content')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('content_key');
    content = data;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">콘텐츠 편집</h1>

      <ContentEditor
        initialContent={content || []}
        projects={projects}
        defaultProjectId={targetProjectId}
        isSuperAdmin={profile.role === 'super_admin'}
      />
    </div>
  );
}
