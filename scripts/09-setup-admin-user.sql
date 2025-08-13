-- Set up admin user and fix RBAC issues
-- This script sets proxima4life@gmail.com as admin and ensures RBAC works properly

-- First, ensure the user_profiles table has all necessary columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'validator', 'admin')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update the specific admin user
UPDATE user_profiles 
SET role = 'admin', 
    status = 'active',
    updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'proxima4life@gmail.com'
);

-- If the user doesn't exist in user_profiles, insert them
INSERT INTO user_profiles (
    user_id, 
    role, 
    status, 
    age, 
    gender, 
    county, 
    education_level, 
    occupation, 
    native_languages,
    fluent_languages,
    mpesa_number,
    created_at,
    updated_at
)
SELECT 
    id, 
    'admin', 
    'active', 
    30, 
    'other', 
    'nairobi', 
    'degree', 
    'System Administrator', 
    ARRAY['en'],
    ARRAY['en', 'sw'],
    '+254700000000',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'proxima4life@gmail.com'
AND id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'admin', 
    status = 'active',
    updated_at = NOW();

-- Create or update role permissions if they don't exist
INSERT INTO role_permissions (role, permission, resource) VALUES
-- User permissions
('user', 'translate', 'sentences'),
('user', 'view', 'own_translations'),
('user', 'update', 'own_profile'),
('user', 'view', 'own_statistics'),

-- Validator permissions (includes all user permissions)
('validator', 'translate', 'sentences'),
('validator', 'view', 'own_translations'),
('validator', 'update', 'own_profile'),
('validator', 'view', 'own_statistics'),
('validator', 'review', 'translations'),
('validator', 'approve', 'translations'),
('validator', 'reject', 'translations'),
('validator', 'view', 'all_translations'),
('validator', 'view', 'user_statistics'),

-- Admin permissions (full access)
('admin', 'manage', 'users'),
('admin', 'manage', 'validators'),
('admin', 'manage', 'translations'),
('admin', 'manage', 'sentences'),
('admin', 'view', 'all_statistics'),
('admin', 'manage', 'system_settings'),
('admin', 'view', 'audit_logs'),
('admin', 'manage', 'roles'),
('admin', 'create', 'users'),
('admin', 'delete', 'users'),
('admin', 'update', 'users')
ON CONFLICT (role, permission, resource) DO NOTHING;

-- Ensure RLS policies are properly set up
DROP POLICY IF EXISTS "Admin full access" ON user_profiles;
CREATE POLICY "Admin full access" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
            AND up.status = 'active'
        )
    );

-- Update the check_user_permission function to be more robust
CREATE OR REPLACE FUNCTION check_user_permission(
    user_uuid UUID,
    required_permission VARCHAR,
    resource_name VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    user_status VARCHAR;
BEGIN
    -- Get user role and status
    SELECT role, status INTO user_role, user_status
    FROM user_profiles
    WHERE user_id = user_uuid;
    
    -- Check if user is active
    IF user_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Admin has all permissions
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permission
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = user_role
        AND rp.permission = required_permission
        AND (resource_name IS NULL OR rp.resource = resource_name)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE user_id = user_uuid AND status = 'active';
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON FUNCTION check_user_permission IS 'Check if user has specific permission for resource';
COMMENT ON FUNCTION get_user_role IS 'Get user role, defaults to user if not found';
