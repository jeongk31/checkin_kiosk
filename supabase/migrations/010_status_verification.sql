-- ============================================
-- Add Status Verification (진위확인) Fields
-- ============================================
-- Adds fields to store 진위확인 results from USEB API
-- This verifies ID card authenticity with government database

-- Add status_verified column for 진위확인 result
ALTER TABLE identity_verifications
ADD COLUMN IF NOT EXISTS status_verified BOOLEAN DEFAULT false;

-- Add status_verification_transaction_id for API tracking
ALTER TABLE identity_verifications
ADD COLUMN IF NOT EXISTS status_verification_transaction_id VARCHAR(255);

-- Add id_type column to store type of ID (1=주민등록증, 2=운전면허증)
ALTER TABLE identity_verifications
ADD COLUMN IF NOT EXISTS id_type VARCHAR(10);

-- Add signature_name column to store the name entered in consent form
ALTER TABLE identity_verifications
ADD COLUMN IF NOT EXISTS signature_name VARCHAR(255);

-- Add signature_matched column to indicate if signature matches a verified guest
ALTER TABLE identity_verifications
ADD COLUMN IF NOT EXISTS signature_matched BOOLEAN;

-- Add index for status_verified queries
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status_verified
ON identity_verifications(status_verified);

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN identity_verifications.status_verified IS '진위확인 result - verified against government database';
COMMENT ON COLUMN identity_verifications.status_verification_transaction_id IS 'Transaction ID from USEB 진위확인 API for tracking';
COMMENT ON COLUMN identity_verifications.id_type IS 'Type of ID card: 1=주민등록증, 2=운전면허증';
COMMENT ON COLUMN identity_verifications.signature_name IS 'Name entered in consent form for matching';
COMMENT ON COLUMN identity_verifications.signature_matched IS 'Whether signature name matched a verified guest name';
