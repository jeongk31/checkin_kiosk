-- Enable Realtime for video_sessions table
-- This is required for postgres_changes to work
ALTER PUBLICATION supabase_realtime ADD TABLE video_sessions;
