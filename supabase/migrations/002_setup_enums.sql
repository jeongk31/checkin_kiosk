-- Run this FIRST in Supabase SQL Editor
-- Step 1: Create ENUM types (if they don't exist)

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'project_admin', 'kiosk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kiosk_status AS ENUM ('online', 'offline', 'busy', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add role column if it doesn't have the right type
-- First check if profiles table needs the role column updated
DO $$
BEGIN
    -- Try to alter the column type
    ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
EXCEPTION
    WHEN undefined_column THEN
        -- Column doesn't exist, add it
        ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'kiosk';
    WHEN others THEN
        -- Column already has correct type or other issue
        NULL;
END $$;

-- Step 3: Create or replace the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'kiosk'::user_role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
