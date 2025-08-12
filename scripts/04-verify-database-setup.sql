-- Comprehensive database verification script
-- This script checks all tables, data, and relationships

-- 1. Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'english_sentences', 'translations', 'translation_reviews')
ORDER BY tablename;

-- 2. Verify english_sentences table structure and data
SELECT 
    'english_sentences' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT difficulty_level) as unique_difficulties,
    MIN(LENGTH(text_content)) as min_text_length,
    MAX(LENGTH(text_content)) as max_text_length,
    AVG(LENGTH(text_content))::INTEGER as avg_text_length
FROM english_sentences;

-- 3. Check category distribution
SELECT 
    category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM english_sentences), 2) as percentage
FROM english_sentences 
GROUP BY category 
ORDER BY count DESC;

-- 4. Check difficulty distribution
SELECT 
    difficulty_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM english_sentences), 2) as percentage
FROM english_sentences 
GROUP BY difficulty_level 
ORDER BY 
    CASE difficulty_level 
        WHEN 'easy' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'hard' THEN 3 
    END;

-- 5. Sample sentences from each category and difficulty
SELECT 
    category,
    difficulty_level,
    LEFT(text_content, 80) || '...' as sample_text,
    LENGTH(text_content) as text_length
FROM english_sentences 
WHERE id IN (
    SELECT DISTINCT ON (category, difficulty_level) id
    FROM english_sentences
    ORDER BY category, difficulty_level, RANDOM()
)
ORDER BY category, difficulty_level;

-- 6. Check user_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check translations table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'translations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('user_profiles', 'translations', 'translation_reviews');

-- 9. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 10. Test data integrity
SELECT 
    'Data Integrity Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM english_sentences WHERE text_content IS NULL OR text_content = '') 
        THEN 'FAIL: Found empty text_content'
        WHEN EXISTS (SELECT 1 FROM english_sentences WHERE category NOT IN ('news', 'literature', 'conversation', 'technical', 'general'))
        THEN 'FAIL: Invalid category found'
        WHEN EXISTS (SELECT 1 FROM english_sentences WHERE difficulty_level NOT IN ('easy', 'medium', 'hard'))
        THEN 'FAIL: Invalid difficulty_level found'
        ELSE 'PASS: All data integrity checks passed'
    END as result;
