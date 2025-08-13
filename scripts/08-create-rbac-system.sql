-- Enhanced RBAC System for Translation Platform
-- Roles: user (translator), validator (reviewer), admin

-- Update user_profiles table to include role and status
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'validator', 'admin')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create user_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission, resource)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, permission, resource) VALUES
-- User permissions
('user', 'translate', 'sentences'),
('user', 'view', 'own_translations'),
('user', 'update', 'own_profile'),
('user', 'view', 'own_statistics'),

-- Validator permissions
('validator', 'translate', 'sentences'),
('validator', 'view', 'own_translations'),
('validator', 'update', 'own_profile'),
('validator', 'view', 'own_statistics'),
('validator', 'review', 'translations'),
('validator', 'approve', 'translations'),
('validator', 'reject', 'translations'),
('validator', 'view', 'all_translations'),
('validator', 'view', 'user_statistics'),

-- Admin permissions
('admin', 'manage', 'users'),
('admin', 'manage', 'validators'),
('admin', 'manage', 'translations'),
('admin', 'manage', 'sentences'),
('admin', 'view', 'all_statistics'),
('admin', 'manage', 'system_settings'),
('admin', 'view', 'audit_logs'),
('admin', 'manage', 'roles')
ON CONFLICT (role, permission, resource) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Validators can view user profiles for translation review context
CREATE POLICY "Validators can view user profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('validator', 'admin')
        )
    );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- RLS policies for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- RLS policies for user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Create functions for role checking
CREATE OR REPLACE FUNCTION check_user_permission(
    user_uuid UUID,
    required_permission VARCHAR,
    resource_name VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM user_profiles
    WHERE user_id = user_uuid;
    
    -- Check if user has the required permission
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = user_role
        AND rp.permission = required_permission
        AND (resource_name IS NULL OR rp.resource = resource_name)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_uuid UUID,
    action_name VARCHAR,
    resource_name VARCHAR DEFAULT NULL,
    resource_uuid UUID DEFAULT NULL,
    activity_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (user_id, action, resource, resource_id, details)
    VALUES (user_uuid, action_name, resource_name, resource_uuid, activity_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login = NOW(), updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default admin user (update with your email)
-- INSERT INTO user_profiles (user_id, role, status, age, gender, county, education_level, occupation, native_languages, mpesa_number)
-- SELECT id, 'admin', 'active', 30, 'other', 'nairobi', 'degree', 'System Administrator', ARRAY['sw'], '+254700000000'
-- FROM auth.users 
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin', status = 'active';

COMMENT ON TABLE user_profiles IS 'Enhanced user profiles with RBAC support';
COMMENT ON TABLE user_sessions IS 'User session management for security tracking';
COMMENT ON TABLE user_activity_logs IS 'Audit trail for user actions';
COMMENT ON TABLE role_permissions IS 'Role-based permission definitions';
