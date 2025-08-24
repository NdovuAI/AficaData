-- Create tables for image-based audio validation system
CREATE TABLE IF NOT EXISTS image_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description_sw TEXT, -- Swahili description/instructions
    description_en TEXT, -- English description/instructions
    description_ka TEXT, -- Kalenjin description/instructions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update voice_recordings table to include image prompts
ALTER TABLE voice_recordings 
ADD COLUMN IF NOT EXISTS image_prompt_id UUID REFERENCES image_prompts(id),
ADD COLUMN IF NOT EXISTS description_text TEXT, -- What the user described
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
ADD COLUMN IF NOT EXISTS rejection_reasons TEXT[], -- Array of rejection reasons
ADD COLUMN IF NOT EXISTS validator_feedback TEXT,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Create validation feedback table
CREATE TABLE IF NOT EXISTS validation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id UUID REFERENCES voice_recordings(id) ON DELETE CASCADE,
    validator_id UUID REFERENCES auth.users(id),
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('approved', 'rejected')),
    rejection_reasons TEXT[],
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample image prompts
INSERT INTO image_prompts (image_url, category, description_sw, description_en, description_ka) VALUES
('/images/prompts/bananas.jpg', 'AGRICULTURE', 'Eleza kile unachoona katika picha hii bila kuanza na "katika picha hii"', 'Describe what you see in this image without starting with "in this picture"', 'Ngot ne itinye eng betut kole ma mache "eng betut kole"'),
('/images/prompts/maize.jpg', 'AGRICULTURE', 'Eleza kile unachoona katika picha hii bila kuanza na "katika picha hii"', 'Describe what you see in this image without starting with "in this picture"', 'Ngot ne itinye eng betut kole ma mache "eng betut kole"'),
('/images/prompts/cattle.jpg', 'LIVESTOCK', 'Eleza kile unachoona katika picha hii bila kuanza na "katika picha hii"', 'Describe what you see in this image without starting with "in this picture"', 'Ngot ne itinye eng betut kole ma mache "eng betut kole"'),
('/images/prompts/market.jpg', 'BUSINESS', 'Eleza kile unachoona katika picha hii bila kuanza na "katika picha hii"', 'Describe what you see in this image without starting with "in this picture"', 'Ngot ne itinye eng betut kole ma mache "eng betut kole"');

-- Enable RLS
ALTER TABLE image_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view image prompts" ON image_prompts FOR SELECT USING (true);
CREATE POLICY "Only admins can manage image prompts" ON image_prompts FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Validators can view all validation feedback" ON validation_feedback FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('validator', 'admin'))
);

CREATE POLICY "Validators can create validation feedback" ON validation_feedback FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('validator', 'admin'))
);
