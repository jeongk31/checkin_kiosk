-- Room Management Schema
-- Tables for room types, daily availability, and reservations

-- ============================================
-- Room Types Table (per project)
-- ============================================
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price INTEGER DEFAULT 0,
    max_guests INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- ============================================
-- Room Availability Table (daily counts per room type)
-- ============================================
CREATE TABLE room_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_rooms INTEGER NOT NULL DEFAULT 0,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    price_override INTEGER, -- Optional price override for this specific date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_type_id, date)
);

-- ============================================
-- Reservations Table (for check-in validation)
-- ============================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
    reservation_number VARCHAR(100) NOT NULL,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    guest_email VARCHAR(255),
    guest_count INTEGER DEFAULT 1,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, checked_in, checked_out, cancelled, no_show
    source VARCHAR(100), -- booking source (e.g., 'direct', 'booking.com', 'agoda', etc.)
    notes TEXT,
    total_price INTEGER,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, reservation_number)
);

-- ============================================
-- Rooms Table (individual rooms with access details)
-- ============================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
    room_number VARCHAR(50) NOT NULL, -- 호수 (e.g., '301', '302')
    access_type VARCHAR(20) NOT NULL DEFAULT 'card', -- 'password' or 'card'
    room_password VARCHAR(100), -- Used when access_type is 'password'
    key_box_number VARCHAR(50), -- Used when access_type is 'card'
    key_box_password VARCHAR(100), -- Used when access_type is 'card'
    status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance, cleaning
    floor INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, room_number)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_room_types_project_id ON room_types(project_id);
CREATE INDEX idx_room_availability_room_type_id ON room_availability(room_type_id);
CREATE INDEX idx_room_availability_project_id ON room_availability(project_id);
CREATE INDEX idx_room_availability_date ON room_availability(date);
CREATE INDEX idx_reservations_project_id ON reservations(project_id);
CREATE INDEX idx_reservations_reservation_number ON reservations(reservation_number);
CREATE INDEX idx_reservations_check_in_date ON reservations(check_in_date);
CREATE INDEX idx_reservations_guest_phone ON reservations(guest_phone);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_rooms_project_id ON rooms(project_id);
CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Room Types
-- ============================================
CREATE POLICY "Super admins can manage all room types" ON room_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their room types" ON room_types
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view their project room types" ON room_types
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Room Availability
-- ============================================
CREATE POLICY "Super admins can manage all room availability" ON room_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their room availability" ON room_availability
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view their project room availability" ON room_availability
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Reservations
-- ============================================
CREATE POLICY "Super admins can manage all reservations" ON reservations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their reservations" ON reservations
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view their project reservations" ON reservations
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- RLS Policies for Rooms
-- ============================================
CREATE POLICY "Super admins can manage all rooms" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their rooms" ON rooms
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can view and update their project rooms" ON rooms
    FOR ALL USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_room_types_updated_at
    BEFORE UPDATE ON room_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_room_availability_updated_at
    BEFORE UPDATE ON room_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
