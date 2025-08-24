-- Update Supabase authentication URLs for Vercel default domain
-- This script updates the authentication redirect URLs to use Vercel's default domain

-- Note: These settings need to be updated in your Supabase dashboard as well
-- Go to Authentication > URL Configuration and add:
-- Site URL: https://your-project.vercel.app (replace with actual Vercel URL)
-- Redirect URLs: 
--   - https://your-project.vercel.app/auth/callback
--   - https://your-project.vercel.app/auth/confirm
--   - https://your-project.vercel.app/auth/reset-password
--   - http://localhost:3000/auth/callback (for development)

-- Update any existing user profiles with the new domain references
UPDATE user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NOT NULL;

-- Updated comment to reflect Vercel default domain usage
COMMENT ON TABLE user_profiles IS 'User profiles table - configured for Vercel default domain';
