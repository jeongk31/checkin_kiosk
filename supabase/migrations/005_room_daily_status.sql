-- ============================================
-- Room Daily Status Table (per-room per-day availability)
-- ============================================
-- This table tracks which specific rooms are available for each day
-- If a room has no entry for a date, it defaults to NOT available
-- If a room has an entry with is_available=true, it can be assigned

CREATE TABLE room_daily_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, date)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_room_daily_status_room_id ON room_daily_status(room_id);
CREATE INDEX idx_room_daily_status_project_id ON room_daily_status(project_id);
CREATE INDEX idx_room_daily_status_date ON room_daily_status(date);
CREATE INDEX idx_room_daily_status_available ON room_daily_status(date, is_available);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE room_daily_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================
CREATE POLICY "Super admins can manage all room daily status" ON room_daily_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their room daily status" ON room_daily_status
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view their project room daily status" ON room_daily_status
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE TRIGGER update_room_daily_status_updated_at
    BEFORE UPDATE ON room_daily_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
