-- ============================================
-- Remove Unused Inventory Tables
-- ============================================
-- The system now uses the simpler rooms.status field directly
-- instead of the complex room_availability and room_daily_status tables.
-- Room status flow:
--   - New rooms default to 'available' (사용 가능)
--   - On check-in, room status becomes 'occupied' (사용중)
--   - Admin can change status back to 'available' or other statuses

-- Drop room_daily_status table and its dependencies
DROP TABLE IF EXISTS room_daily_status CASCADE;

-- Drop room_availability table and its dependencies
DROP TABLE IF EXISTS room_availability CASCADE;
