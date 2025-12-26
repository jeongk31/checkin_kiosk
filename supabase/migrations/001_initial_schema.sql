-- Hotel Check-in Kiosk System Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================
CREATE TYPE user_role AS ENUM ('super_admin', 'project_admin', 'kiosk');
CREATE TYPE kiosk_status AS ENUM ('online', 'offline', 'busy', 'error');

-- ============================================
-- Projects Table (Hotels)
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Profiles Table (Extended user info)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'kiosk',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Kiosks Table (Physical kiosk devices)
-- ============================================
CREATE TABLE kiosks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status kiosk_status DEFAULT 'offline',
    current_screen VARCHAR(100) DEFAULT 'start',
    current_session_id UUID,
    last_seen TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Kiosk Content Table (Customizable texts per project)
-- ============================================
CREATE TABLE kiosk_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content_key VARCHAR(255) NOT NULL,
    content_value TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ko',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, content_key, language)
);

-- ============================================
-- Video Call Sessions Table
-- ============================================
CREATE TABLE video_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES profiles(id),
    room_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, connected, ended
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- ============================================
-- Check-in Sessions Table (For tracking)
-- ============================================
CREATE TABLE checkin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(255),
    guest_count INTEGER DEFAULT 1,
    room_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    current_step VARCHAR(100),
    data JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_project_id ON profiles(project_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_kiosks_project_id ON kiosks(project_id);
CREATE INDEX idx_kiosks_status ON kiosks(status);
CREATE INDEX idx_kiosk_content_project_id ON kiosk_content(project_id);
CREATE INDEX idx_kiosk_content_key ON kiosk_content(content_key);
CREATE INDEX idx_video_sessions_kiosk_id ON video_sessions(kiosk_id);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_checkin_sessions_kiosk_id ON checkin_sessions(kiosk_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Profiles
-- ============================================
-- Super admins can see all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Project admins can see profiles in their project
CREATE POLICY "Project admins can view own project profiles" ON profiles
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

-- Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Project admins can insert kiosk profiles for their project
CREATE POLICY "Project admins can insert kiosk profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'project_admin'
            AND p.project_id = project_id
        )
        AND role = 'kiosk'
    );

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- ============================================
-- RLS Policies for Projects
-- ============================================
CREATE POLICY "Super admins can do anything with projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can view their project" ON projects
    FOR SELECT USING (
        id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Kiosks can view their project" ON projects
    FOR SELECT USING (
        id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Kiosks
-- ============================================
CREATE POLICY "Super admins can do anything with kiosks" ON kiosks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their kiosks" ON kiosks
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view and update themselves" ON kiosks
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Kiosk Content
-- ============================================
CREATE POLICY "Super admins can manage all content" ON kiosk_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their content" ON kiosk_content
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view their project content" ON kiosk_content
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Video Sessions
-- ============================================
CREATE POLICY "Super admins can manage all video sessions" ON video_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their video sessions" ON video_sessions
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can create and view their video sessions" ON video_sessions
    FOR ALL USING (
        kiosk_id IN (
            SELECT k.id FROM kiosks k
            JOIN profiles p ON k.profile_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS Policies for Check-in Sessions
-- ============================================
CREATE POLICY "Super admins can view all checkin sessions" ON checkin_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can view their checkin sessions" ON checkin_sessions
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can manage their checkin sessions" ON checkin_sessions
    FOR ALL USING (
        kiosk_id IN (
            SELECT k.id FROM kiosks k
            JOIN profiles p ON k.profile_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- ============================================
-- Functions
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'kiosk');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_kiosks_updated_at
    BEFORE UPDATE ON kiosks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_kiosk_content_updated_at
    BEFORE UPDATE ON kiosk_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Default Content Template
-- ============================================
CREATE OR REPLACE FUNCTION create_default_content(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO kiosk_content (project_id, content_key, content_value, language) VALUES
    (p_project_id, 'welcome_title', '환영합니다', 'ko'),
    (p_project_id, 'welcome_subtitle', '화면을 터치하여 체크인을 시작하세요', 'ko'),
    (p_project_id, 'start_button', '체크인 시작', 'ko'),
    (p_project_id, 'staff_call_button', '직원 호출', 'ko'),
    (p_project_id, 'personal_info_title', '개인정보 입력', 'ko'),
    (p_project_id, 'phone_label', '대표자 휴대폰 번호', 'ko'),
    (p_project_id, 'email_label', '이메일', 'ko'),
    (p_project_id, 'guest_count_label', '인원 수', 'ko'),
    (p_project_id, 'consent_text', '개인정보 수집 및 이용에 동의합니다', 'ko'),
    (p_project_id, 'id_verification_title', '신분증 확인', 'ko'),
    (p_project_id, 'id_instructions', '신분증을 카메라 중앙에 비춰주세요', 'ko'),
    (p_project_id, 'payment_title', '결제하기', 'ko'),
    (p_project_id, 'complete_title', '체크인이 완료되었습니다', 'ko'),
    (p_project_id, 'room_number_label', '객실 번호', 'ko'),
    (p_project_id, 'checkout_time_label', '체크아웃 시간', 'ko'),
    (p_project_id, 'back_button', '이전', 'ko'),
    (p_project_id, 'next_button', '다음', 'ko'),
    (p_project_id, 'home_button', '처음으로', 'ko');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Insert Initial Super Admin (run manually after first signup)
-- ============================================
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
