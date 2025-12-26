import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, fullName, role, projectId } = await request.json();

    // Validate permissions
    if (profile.role === 'project_admin') {
      // Project admins can only create kiosk accounts in their project
      if (role !== 'kiosk') {
        return NextResponse.json(
          { error: 'Project admins can only create kiosk accounts' },
          { status: 403 }
        );
      }
      if (projectId !== profile.project_id) {
        return NextResponse.json(
          { error: 'Cannot create accounts for other projects' },
          { status: 403 }
        );
      }
    } else if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert or update the profile (trigger may not fire for admin API)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email,
        full_name: fullName,
        role,
        project_id: projectId || null,
        is_active: true,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: delete the auth user if profile update fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // If role is kiosk, automatically create a kiosk entry
    if (role === 'kiosk' && projectId) {
      const { error: kioskError } = await supabase
        .from('kiosks')
        .insert({
          project_id: projectId,
          profile_id: profileData.id,
          name: fullName || email,
          status: 'offline',
        });

      if (kioskError) {
        console.error('Error creating kiosk:', kioskError);
        // Don't fail the whole operation, kiosk entry is supplementary
      }
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
