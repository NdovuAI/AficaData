-- Update Supabase authentication URLs for custom domain
-- This script updates the authentication redirect URLs to use the custom domain

-- Note: These settings need to be updated in your Supabase dashboard as well
-- Go to Authentication > URL Configuration and add:
-- Site URL: https://ndovu.guru
-- Redirect URLs: 
--   - https://ndovu.guru/auth/callback
--   - https://ndovu.guru/auth/confirm
--   - https://ndovu.guru/auth/reset-password
--   - http://localhost:3000/auth/callback (for development)

-- Update any existing user profiles with the new domain references
UPDATE user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NOT NULL;

-- Add a comment for reference
COMMENT ON TABLE user_profiles IS 'User profiles table - configured for ndovu.guru domain';
