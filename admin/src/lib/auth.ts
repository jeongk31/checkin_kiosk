import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, project:projects(*)')
    .eq('user_id', user.id)
    .single();

  return profile;
}

export async function requireAuth() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error('Unauthorized');
  }
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await requireAuth();
  if (profile.role !== 'super_admin') {
    throw new Error('Forbidden: Super Admin access required');
  }
  return profile;
}

export async function requireProjectAdmin() {
  const profile = await requireAuth();
  if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
    throw new Error('Forbidden: Project Admin access required');
  }
  return profile;
}
