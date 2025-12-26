-- Add caller_type column to video_sessions for bidirectional voice calls
-- caller_type: 'kiosk' (guest calling staff) or 'manager' (staff calling kiosk)

ALTER TABLE video_sessions
ADD COLUMN caller_type VARCHAR(20) DEFAULT 'kiosk';

-- Add index for efficient filtering by caller type
CREATE INDEX idx_video_sessions_caller_type ON video_sessions(caller_type);

-- Comment for documentation
COMMENT ON COLUMN video_sessions.caller_type IS 'Identifies who initiated the call: kiosk (guest) or manager (staff)';
