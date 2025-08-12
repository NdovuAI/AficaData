-- Update schema to accommodate Kalenjin healthcare translation data
-- Add new columns and modify existing structure

-- Add new columns to english_sentences table for healthcare data
ALTER TABLE english_sentences 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Update category constraint to include healthcare
ALTER TABLE english_sentences 
DROP CONSTRAINT IF EXISTS english_sentences_category_check;

ALTER TABLE english_sentences 
ADD CONSTRAINT english_sentences_category_check 
CHECK (category IN ('news', 'literature', 'conversation', 'technical', 'general', 'healthcare'));

-- Add language dialect column to translations table
ALTER TABLE translations 
ADD COLUMN IF NOT EXISTS language_dialect TEXT;

-- Create kalenjin_healthcare_data table for the imported data
CREATE TABLE IF NOT EXISTS kalenjin_healthcare_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    serial_number TEXT,
    source TEXT DEFAULT 'MedQuAD',
    topic TEXT DEFAULT 'Healthcare',
    original_english TEXT NOT NULL,
    kalenjin_translation TEXT NOT NULL,
    language_dialect TEXT DEFAULT 'Nandi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- Enable RLS for the new table
ALTER TABLE kalenjin_healthcare_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the healthcare data
CREATE POLICY "Authenticated users can view healthcare data" ON kalenjin_healthcare_data
    FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kalenjin_healthcare_serial ON kalenjin_healthcare_data(serial_number);
CREATE INDEX IF NOT EXISTS idx_kalenjin_healthcare_processed ON kalenjin_healthcare_data(processed);
CREATE INDEX IF NOT EXISTS idx_english_sentences_source ON english_sentences(source);
CREATE INDEX IF NOT EXISTS idx_english_sentences_topic ON english_sentences(topic);
CREATE INDEX IF NOT EXISTS idx_translations_dialect ON translations(language_dialect);

-- Add some sample reviewers for Kalenjin translations
INSERT INTO user_profiles (
    user_id, 
    age, 
    gender, 
    county, 
    education_level, 
    occupation, 
    native_languages, 
    fluent_languages, 
    role
) VALUES 
-- Sample Kalenjin reviewers (using placeholder UUIDs - these would be real user IDs in production)
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    35,
    'female',
    'Uasin Gishu',
    'degree',
    'Language Teacher',
    ARRAY['kalenjin', 'nandi'],
    ARRAY['kalenjin', 'nandi', 'english', 'swahili'],
    'reviewer'
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    42,
    'male',
    'Nandi',
    'masters',
    'Healthcare Professional',
    ARRAY['kalenjin', 'nandi'],
    ARRAY['kalenjin', 'nandi', 'english'],
    'reviewer'
),
(
    '00000000-0000-0000-0000-000000000003'::uuid,
    28,
    'female',
    'Elgeyo Marakwet',
    'diploma',
    'Community Health Worker',
    ARRAY['kalenjin', 'keiyo'],
    ARRAY['kalenjin', 'keiyo', 'english', 'swahili'],
    'reviewer'
)
ON CONFLICT (user_id) DO NOTHING;
