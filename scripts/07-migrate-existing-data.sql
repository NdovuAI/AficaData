-- Migrate existing English sentences to the new standard_sentences table
-- Insert existing English sentences into standard_sentences table

INSERT INTO standard_sentences (
    original_text, 
    original_language, 
    category, 
    difficulty_level, 
    source, 
    topic,
    is_active,
    created_at
)
SELECT 
    text_content as original_text,
    'english' as original_language,
    COALESCE(category, 'general') as category,
    COALESCE(difficulty_level, 'intermediate') as difficulty_level,
    'Legacy English Sentences' as source,
    'General' as topic,
    COALESCE(is_active, true) as is_active,
    COALESCE(created_at, NOW()) as created_at
FROM english_sentences
WHERE text_content IS NOT NULL AND text_content != ''
ON CONFLICT DO NOTHING;

-- Update existing translations to reference new system
-- This creates a bridge between old and new systems
UPDATE translations 
SET review_status = 'migrated'
WHERE review_status IS NULL;
