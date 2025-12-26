import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'No session created' }, { status: 401 });
    }

    // Use service client to bypass RLS for profile check
    const serviceClient = await createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, is_active')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 403 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    // Determine redirect URL based on role
    const redirectUrl = profile.role === 'kiosk' ? '/kiosk' : '/dashboard';

    return NextResponse.json({ success: true, redirectUrl });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
