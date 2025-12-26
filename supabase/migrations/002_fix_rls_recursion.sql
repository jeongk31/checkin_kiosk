-- ============================================
-- Fix RLS infinite recursion on profiles table
-- ============================================

-- Create a security definer function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get user's project_id
CREATE OR REPLACE FUNCTION public.get_user_project_id()
RETURNS UUID AS $$
DECLARE
  proj_id UUID;
BEGIN
  SELECT project_id INTO proj_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN proj_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Project admins can view own project profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Project admins can insert kiosk profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Recreate policies using the helper functions
-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Project admins can view profiles in their project
CREATE POLICY "Project admins can view own project profiles" ON profiles
    FOR SELECT USING (
        public.get_user_role() = 'project_admin'
        AND project_id = public.get_user_project_id()
    );

-- Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

-- Project admins can insert kiosk profiles for their project
CREATE POLICY "Project admins can insert kiosk profiles" ON profiles
    FOR INSERT WITH CHECK (
        public.get_user_role() = 'project_admin'
        AND role = 'kiosk'
        AND project_id = public.get_user_project_id()
    );

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON profiles
    FOR UPDATE USING (public.get_user_role() = 'super_admin');

-- Project admins can update kiosk profiles in their project
CREATE POLICY "Project admins can update kiosk profiles" ON profiles
    FOR UPDATE USING (
        public.get_user_role() = 'project_admin'
        AND role = 'kiosk'
        AND project_id = public.get_user_project_id()
    );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles" ON profiles
    FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================
-- Fix other tables that reference profiles for role checks
-- ============================================

-- Projects policies
DROP POLICY IF EXISTS "Super admins can do anything with projects" ON projects;
DROP POLICY IF EXISTS "Project admins can view their project" ON projects;

CREATE POLICY "Super admins can do anything with projects" ON projects
    FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Project admins can view their project" ON projects
    FOR SELECT USING (id = public.get_user_project_id());

-- Kiosks policies
DROP POLICY IF EXISTS "Super admins can manage all kiosks" ON kiosks;
DROP POLICY IF EXISTS "Project admins can manage their kiosks" ON kiosks;

CREATE POLICY "Super admins can manage all kiosks" ON kiosks
    FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Project admins can manage their kiosks" ON kiosks
    FOR ALL USING (project_id = public.get_user_project_id());

-- Kiosk content policies
DROP POLICY IF EXISTS "Super admins can manage all content" ON kiosk_content;
DROP POLICY IF EXISTS "Project admins can manage their content" ON kiosk_content;
DROP POLICY IF EXISTS "Kiosks can view their project content" ON kiosk_content;

CREATE POLICY "Super admins can manage all content" ON kiosk_content
    FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Project admins can manage their content" ON kiosk_content
    FOR ALL USING (project_id = public.get_user_project_id());

CREATE POLICY "Kiosks can view their project content" ON kiosk_content
    FOR SELECT USING (project_id = public.get_user_project_id());

-- Video sessions policies
DROP POLICY IF EXISTS "Super admins can view all video sessions" ON video_sessions;
DROP POLICY IF EXISTS "Project users can manage their video sessions" ON video_sessions;

CREATE POLICY "Super admins can view all video sessions" ON video_sessions
    FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Project users can manage their video sessions" ON video_sessions
    FOR ALL USING (
        kiosk_id IN (
            SELECT id FROM kiosks WHERE project_id = public.get_user_project_id()
        )
    );

-- Checkin sessions policies
DROP POLICY IF EXISTS "Super admins can view all checkin sessions" ON checkin_sessions;
DROP POLICY IF EXISTS "Project users can manage their checkin sessions" ON checkin_sessions;

CREATE POLICY "Super admins can view all checkin sessions" ON checkin_sessions
    FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Project users can manage their checkin sessions" ON checkin_sessions
    FOR ALL USING (project_id = public.get_user_project_id());
