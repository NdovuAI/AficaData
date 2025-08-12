-- This script creates a test user profile for testing purposes
-- Note: The user must first be created through the authentication system

-- Insert a test user profile (replace the user_id with an actual authenticated user ID)
-- This is just an example - in practice, profiles are created through the app
INSERT INTO user_profiles (
    user_id,
    age,
    gender,
    county,
    education_level,
    occupation,
    native_languages,
    fluent_languages,
    mpesa_number,
    role
) VALUES (
    -- Replace this with actual user ID from auth.users after creating a user
    '00000000-0000-0000-0000-000000000000',
    25,
    'male',
    'nairobi',
    'degree',
    'Software Developer',
    ARRAY['sw', 'kik'],
    ARRAY['luo', 'kal'],
    '+254700000000',
    'translator'
) ON CONFLICT (user_id) DO NOTHING;

-- Add some test translations (optional)
-- These would be created through the app interface normally
