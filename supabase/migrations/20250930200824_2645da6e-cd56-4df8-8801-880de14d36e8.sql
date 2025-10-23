-- Example: Create your first admin user
-- Replace the email with the email of an existing user who should become an admin

-- First, ensure the user exists in auth.users by signing them up normally through the app
-- Then run this to make them a super admin:

-- INSERT INTO admin_users (user_id, email, full_name, role)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
--   'super_admin'::admin_role
-- FROM auth.users
-- WHERE email = 'your-admin@example.com';

-- Note: Uncomment and modify the above INSERT statement to create your first admin
-- This is commented to prevent accidental execution