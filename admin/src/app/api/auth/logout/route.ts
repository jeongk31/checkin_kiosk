import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}

// GET handler for redirect-based logout (used by kiosk remote logout)
export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear all Supabase auth cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Create response with redirect
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));

  // Delete all auth-related cookies
  for (const cookie of allCookies) {
    if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
