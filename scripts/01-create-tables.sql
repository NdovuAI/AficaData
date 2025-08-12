-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    county TEXT,
    education_level TEXT CHECK (education_level IN ('primary', 'secondary', 'certificate', 'diploma', 'degree', 'masters', 'phd')),
    occupation TEXT,
    native_languages TEXT[], -- Array of language codes
    fluent_languages TEXT[], -- Array of language codes
    mpesa_number TEXT,
    role TEXT DEFAULT 'translator' CHECK (role IN ('translator', 'reviewer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create english_sentences table
CREATE TABLE english_sentences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    text_content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('news', 'literature', 'conversation', 'technical', 'general')),
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create translations table
CREATE TABLE translations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    english_sentence_id UUID REFERENCES english_sentences(id) ON DELETE CASCADE,
    translator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    target_language TEXT NOT NULL,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'in_review')),
    review_count INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(english_sentence_id, translator_id, target_language)
);

-- Create translation_reviews table
CREATE TABLE translation_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    comments TEXT,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(translation_id, reviewer_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_translations_translator_id ON translations(translator_id);
CREATE INDEX idx_translations_status ON translations(review_status);
CREATE INDEX idx_translations_language ON translations(target_language);
CREATE INDEX idx_english_sentences_active ON english_sentences(is_active);
CREATE INDEX idx_translation_reviews_translation_id ON translation_reviews(translation_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE english_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- English sentences: All authenticated users can read
CREATE POLICY "Authenticated users can view sentences" ON english_sentences
    FOR SELECT TO authenticated USING (is_active = true);

-- Translations: Users can view their own translations and insert new ones
CREATE POLICY "Users can view own translations" ON translations
    FOR SELECT USING (auth.uid() = translator_id);

CREATE POLICY "Users can insert own translations" ON translations
    FOR INSERT WITH CHECK (auth.uid() = translator_id);

-- Translation reviews: Reviewers can view and insert reviews
CREATE POLICY "Reviewers can view reviews" ON translation_reviews
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Reviewers can insert reviews" ON translation_reviews
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
