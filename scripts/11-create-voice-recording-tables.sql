-- Create voice recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sentence_id UUID REFERENCES english_sentences(id) ON DELETE CASCADE,
    audio_file_path TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    language TEXT NOT NULL,
    category TEXT,
    quality_score DECIMAL(3,2),
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_status ON voice_recordings(status);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_language ON voice_recordings(language);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_created_at ON voice_recordings(created_at);

-- Enable RLS
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recordings" ON voice_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings" ON voice_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" ON voice_recordings
    FOR UPDATE USING (auth.uid() = user_id);

-- Validators and admins can view all recordings
CREATE POLICY "Validators can view all recordings" ON voice_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('validator', 'admin')
        )
    );

-- Validators and admins can update recordings (for review)
CREATE POLICY "Validators can update recordings" ON voice_recordings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('validator', 'admin')
        )
    );

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'voice-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'voice-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Validators and admins can access all recordings
CREATE POLICY "Validators can access all recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'voice-recordings' 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('validator', 'admin')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_voice_recordings_updated_at
    BEFORE UPDATE ON voice_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_recordings_updated_at();
