-- Add verified_guests column to reservations table
-- This stores the names of guests who completed identity verification during check-in

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS verified_guests JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN reservations.verified_guests IS 'Array of verified guest names from OCR during check-in. Format: [{"name": "홍길동", "verified_at": "2024-01-01T12:00:00Z", "verification_id": "uuid"}]';

-- Create index for faster queries on verified guests
CREATE INDEX IF NOT EXISTS idx_reservations_verified_guests ON reservations USING GIN (verified_guests);
