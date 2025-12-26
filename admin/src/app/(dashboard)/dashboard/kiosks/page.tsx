import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KioskManagement from './KioskManagement';

export default async function KiosksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createServiceClient();
  const isSuperAdmin = profile.role === 'super_admin';

  // Get all projects (for super admin) or just the user's project
  let projectsQuery = supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (!isSuperAdmin && profile.project_id) {
    projectsQuery = projectsQuery.eq('id', profile.project_id);
  }

  const { data: projects } = await projectsQuery;

  // Get all kiosks with their project info
  let kiosksQuery = supabase
    .from('kiosks')
    .select('*, project:projects(*), profile:profiles(*)')
    .order('created_at', { ascending: false });

  if (!isSuperAdmin && profile.project_id) {
    kiosksQuery = kiosksQuery.eq('project_id', profile.project_id);
  }

  const { data: kiosks } = await kiosksQuery;

  // Get content for all relevant projects
  let contentQuery = supabase
    .from('kiosk_content')
    .select('*')
    .order('content_key');

  if (!isSuperAdmin && profile.project_id) {
    contentQuery = contentQuery.eq('project_id', profile.project_id);
  }

  const { data: content } = await contentQuery;

  return (
    <KioskManagement
      projects={projects || []}
      kiosks={kiosks || []}
      content={content || []}
      isSuperAdmin={isSuperAdmin}
      currentProjectId={profile.project_id}
    />
  );
}
