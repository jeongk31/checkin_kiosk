-- ============================================
-- Identity Verification Records Table
-- ============================================
-- Stores identity verification results for hotel check-in
-- Linked to reservations and projects

CREATE TABLE identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,

    -- Guest info (extracted from OCR, NOT storing full ID number for privacy)
    guest_index INTEGER DEFAULT 0, -- For multiple guests (0 = primary guest)
    guest_name VARCHAR(255),

    -- Verification results
    ocr_success BOOLEAN DEFAULT false,
    id_verified BOOLEAN DEFAULT false,
    liveness_passed BOOLEAN DEFAULT false,
    face_matched BOOLEAN DEFAULT false,

    -- Scores
    similarity_score DECIMAL(5,4), -- Face comparison score (0.0000 - 1.0000)
    liveness_score DECIMAL(5,4),   -- Liveness confidence score

    -- Age verification
    is_adult BOOLEAN DEFAULT false,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed, expired
    failure_reason TEXT,

    -- Timestamps
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_identity_verifications_project_id ON identity_verifications(project_id);
CREATE INDEX idx_identity_verifications_reservation_id ON identity_verifications(reservation_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_identity_verifications_created_at ON identity_verifications(created_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================
CREATE POLICY "Super admins can manage all identity verifications" ON identity_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Project admins can manage their identity verifications" ON identity_verifications
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

CREATE POLICY "Kiosks can create and view their project identity verifications" ON identity_verifications
    FOR ALL USING (
        project_id IN (SELECT project_id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE TRIGGER update_identity_verifications_updated_at
    BEFORE UPDATE ON identity_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Add verification_data column to reservations if not exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reservations' AND column_name = 'verification_data'
    ) THEN
        ALTER TABLE reservations ADD COLUMN verification_data JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE identity_verifications IS 'Stores identity verification results from useB API for hotel check-in';
COMMENT ON COLUMN identity_verifications.guest_index IS 'Index of guest in group (0 = primary guest)';
COMMENT ON COLUMN identity_verifications.similarity_score IS 'Face comparison similarity score from Alchera Face Server';
COMMENT ON COLUMN identity_verifications.liveness_score IS 'Liveness detection confidence score';
