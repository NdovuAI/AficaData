-- Create the missing database tables that are required for the application
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    native_language TEXT NOT NULL,
    proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'native')),
    specializations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create english_sentences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.english_sentences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sentence TEXT NOT NULL,
    topic TEXT,
    difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    english_sentence_id UUID REFERENCES public.english_sentences(id) ON DELETE CASCADE NOT NULL,
    translator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    translation TEXT NOT NULL,
    target_language TEXT NOT NULL,
    dialect TEXT,
    confidence_score INTEGER DEFAULT 3 CHECK (confidence_score >= 1 AND confidence_score <= 5),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create translation_reviews table
CREATE TABLE IF NOT EXISTS public.translation_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    translation_id UUID REFERENCES public.translations(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create healthcare_translations table for Kalenjin data
CREATE TABLE IF NOT EXISTS public.healthcare_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number TEXT,
    source TEXT DEFAULT 'MedQuAD',
    topic TEXT DEFAULT 'Healthcare',
    original_english TEXT NOT NULL,
    kalenjin_translation TEXT NOT NULL,
    dialect TEXT DEFAULT 'Nandi',
    verified BOOLEAN DEFAULT FALSE,
    reviewer_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- English sentences: all authenticated users can read
CREATE POLICY "Authenticated users can view sentences" ON public.english_sentences
    FOR SELECT TO authenticated USING (true);

-- Translations: users can see all translations but only edit their own
CREATE POLICY "Authenticated users can view translations" ON public.translations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own translations" ON public.translations
    FOR INSERT TO authenticated WITH CHECK (translator_id IN (
        SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update own translations" ON public.translations
    FOR UPDATE TO authenticated USING (translator_id IN (
        SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
    ));

-- Translation reviews: authenticated users can view and create reviews
CREATE POLICY "Authenticated users can view reviews" ON public.translation_reviews
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews" ON public.translation_reviews
    FOR INSERT TO authenticated WITH CHECK (reviewer_id IN (
        SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
    ));

-- Healthcare translations: all authenticated users can read
CREATE POLICY "Authenticated users can view healthcare translations" ON public.healthcare_translations
    FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_english_sentence_id ON public.translations(english_sentence_id);
CREATE INDEX IF NOT EXISTS idx_translations_translator_id ON public.translations(translator_id);
CREATE INDEX IF NOT EXISTS idx_translation_reviews_translation_id ON public.translation_reviews(translation_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_translations_dialect ON public.healthcare_translations(dialect);

-- Insert some sample English sentences
INSERT INTO public.english_sentences (sentence, topic, difficulty_level, source) VALUES
('Hello, how are you today?', 'greetings', 'beginner', 'manual'),
('What is your name?', 'introductions', 'beginner', 'manual'),
('Where do you live?', 'personal_info', 'beginner', 'manual'),
('I am feeling sick and need to see a doctor.', 'healthcare', 'intermediate', 'manual'),
('Can you help me find the hospital?', 'healthcare', 'intermediate', 'manual')
ON CONFLICT DO NOTHING;
