import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;

  // Get user role from profile using service role to bypass RLS
  if (user) {
    const serviceClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    userRole = profile?.role || null;
  }

  const isAuthPage = request.nextUrl.pathname === '/login';
  const isPublicPage = request.nextUrl.pathname === '/';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isKioskRoute = request.nextUrl.pathname.startsWith('/kiosk');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // Skip middleware for API routes
  if (isApiRoute) {
    return supabaseResponse;
  }

  // If not logged in and trying to access protected route
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If logged in, handle role-based routing
  if (user && userRole) {
    const isKioskUser = userRole === 'kiosk';

    // Redirect kiosk users trying to access dashboard to kiosk
    if (isKioskUser && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/kiosk';
      return NextResponse.redirect(url);
    }

    // Redirect admin/project_admin users trying to access kiosk to dashboard
    if (!isKioskUser && isKioskRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Redirect from login page based on role
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = isKioskUser ? '/kiosk' : '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
