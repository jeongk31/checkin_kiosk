import { getCurrentProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RoomManager from './RoomManager';

export default async function RoomsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  // Only project admins and super admins can access this page
  if (profile.role !== 'super_admin' && profile.role !== 'project_admin') {
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

  const targetProjectId = profile.project_id || projects?.[0]?.id;

  // Get the current project for settings
  let currentProject = null;
  if (targetProjectId) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', targetProjectId)
      .single();
    currentProject = data;
  }

  // Get room types for the current project
  let roomTypes = null;
  if (targetProjectId) {
    const { data } = await supabase
      .from('room_types')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('display_order');
    roomTypes = data;
  }

  // Get today's reservations only
  const today = new Date().toISOString().split('T')[0];
  let reservations = null;
  if (targetProjectId) {
    const { data } = await supabase
      .from('reservations')
      .select('*, room_type:room_types(*)')
      .eq('project_id', targetProjectId)
      .eq('check_in_date', today)
      .order('created_at', { ascending: false })
      .limit(100);
    reservations = data;
  }

  // Get individual rooms
  let rooms = null;
  if (targetProjectId) {
    const { data } = await supabase
      .from('rooms')
      .select('*, room_type:room_types(*)')
      .eq('project_id', targetProjectId)
      .order('room_number');
    rooms = data;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">당일 객실 관리</h1>

      <RoomManager
        projects={projects}
        defaultProjectId={targetProjectId}
        initialRoomTypes={roomTypes || []}
        initialReservations={reservations || []}
        initialRooms={rooms || []}
        isSuperAdmin={profile.role === 'super_admin'}
        initialProject={currentProject}
      />
    </div>
  );
}
