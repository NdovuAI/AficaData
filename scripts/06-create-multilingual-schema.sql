-- Enhanced Multilingual Translation System Schema
-- Supports English, Swahili, and Kalenjin languages

-- Create standard_sentences table for multilingual content
CREATE TABLE IF NOT EXISTS standard_sentences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number TEXT,
    source TEXT NOT NULL DEFAULT 'Manual Entry',
    topic TEXT NOT NULL DEFAULT 'General',
    original_text TEXT NOT NULL,
    original_language TEXT NOT NULL CHECK (original_language IN ('english', 'swahili')),
    translated_text TEXT,
    target_language TEXT NOT NULL DEFAULT 'kalenjin',
    dialect TEXT DEFAULT 'Nandi',
    category TEXT NOT NULL DEFAULT 'general',
    difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_standard_sentences_language ON standard_sentences(original_language);
CREATE INDEX IF NOT EXISTS idx_standard_sentences_category ON standard_sentences(category);
CREATE INDEX IF NOT EXISTS idx_standard_sentences_active ON standard_sentences(is_active);
CREATE INDEX IF NOT EXISTS idx_standard_sentences_difficulty ON standard_sentences(difficulty_level);

-- Update existing english_sentences table to be compatible
ALTER TABLE english_sentences ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Legacy Data';
ALTER TABLE english_sentences ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General';
ALTER TABLE english_sentences ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Create user_translations table for tracking user translation attempts
CREATE TABLE IF NOT EXISTS user_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sentence_id UUID REFERENCES standard_sentences(id) ON DELETE CASCADE,
    legacy_sentence_id UUID REFERENCES english_sentences(id) ON DELETE CASCADE,
    user_translation TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    is_correct BOOLEAN,
    score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either sentence_id or legacy_sentence_id is set
    CONSTRAINT check_sentence_reference CHECK (
        (sentence_id IS NOT NULL AND legacy_sentence_id IS NULL) OR
        (sentence_id IS NULL AND legacy_sentence_id IS NOT NULL)
    )
);

-- Create indexes for user_translations
CREATE INDEX IF NOT EXISTS idx_user_translations_user ON user_translations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_translations_sentence ON user_translations(sentence_id);
CREATE INDEX IF NOT EXISTS idx_user_translations_legacy ON user_translations(legacy_sentence_id);
CREATE INDEX IF NOT EXISTS idx_user_translations_created ON user_translations(created_at);

-- Enable RLS on new tables
ALTER TABLE standard_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for standard_sentences
CREATE POLICY "Anyone can read standard sentences" ON standard_sentences
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can insert standard sentences" ON standard_sentences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for user_translations
CREATE POLICY "Users can read their own translations" ON user_translations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translations" ON user_translations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own translations" ON user_translations
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get random sentence for translation
CREATE OR REPLACE FUNCTION get_random_sentence_for_translation(
    p_language TEXT DEFAULT 'english',
    p_category TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    original_text TEXT,
    original_language TEXT,
    category TEXT,
    difficulty_level TEXT,
    source TEXT,
    topic TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.original_text,
        s.original_language,
        s.category,
        s.difficulty_level,
        s.source,
        s.topic
    FROM standard_sentences s
    WHERE s.is_active = true
        AND s.original_language = p_language
        AND (p_category IS NULL OR s.category = p_category)
        AND (p_difficulty IS NULL OR s.difficulty_level = p_difficulty)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get translation statistics
CREATE OR REPLACE FUNCTION get_user_translation_stats(p_user_id UUID)
RETURNS TABLE (
    total_translations BIGINT,
    correct_translations BIGINT,
    accuracy_percentage NUMERIC,
    average_score NUMERIC,
    languages_practiced TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_translations,
        COUNT(*) FILTER (WHERE is_correct = true) as correct_translations,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE is_correct = true) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as accuracy_percentage,
        COALESCE(AVG(score), 0) as average_score,
        ARRAY_AGG(DISTINCT target_language) as languages_practiced
    FROM user_translations
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON standard_sentences TO authenticated;
GRANT ALL ON user_translations TO authenticated;
GRANT EXECUTE ON FUNCTION get_random_sentence_for_translation TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_translation_stats TO authenticated;
