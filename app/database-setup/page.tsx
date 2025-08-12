"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Database, Copy, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TableCheck {
  name: string
  exists: boolean
  error?: string
  rowCount?: number
}

export default function DatabaseSetupPage() {
  const [tableChecks, setTableChecks] = useState<TableCheck[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null)
  const supabase = createClient()

  const checkDatabaseTables = async () => {
    setIsChecking(true)
    const checks: TableCheck[] = []

    // Get Supabase project info
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectId = url?.split("//")[1]?.split(".")[0]
    setSupabaseInfo({ url, projectId })

    // Tables to check
    const tablesToCheck = ["user_profiles", "english_sentences", "translations", "translation_reviews"]

    for (const tableName of tablesToCheck) {
      try {
        const { data, error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (error) {
          checks.push({
            name: tableName,
            exists: false,
            error: error.message,
          })
        } else {
          checks.push({
            name: tableName,
            exists: true,
            rowCount: count || 0,
          })
        }
      } catch (err: any) {
        checks.push({
          name: tableName,
          exists: false,
          error: err.message,
        })
      }
    }

    setTableChecks(checks)
    setIsChecking(false)
  }

  const copyScript = (scriptName: string, content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: `${scriptName} copied to clipboard`,
    })
  }

  const createTablesScript = `-- Enable UUID extension
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
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);`

  const seedDataScript = `-- Insert sample English sentences (only if table is empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM english_sentences) = 0 THEN
        INSERT INTO english_sentences (text_content, category, difficulty_level) VALUES
        ('Hello, how are you today?', 'conversation', 'easy'),
        ('The sun is shining brightly.', 'general', 'easy'),
        ('I like to eat apples.', 'general', 'easy'),
        ('What is your name?', 'conversation', 'easy'),
        ('The cat is sleeping.', 'general', 'easy'),
        ('The government announced new policies to improve healthcare access.', 'news', 'medium'),
        ('Climate change continues to affect agricultural productivity across the region.', 'news', 'medium'),
        ('The implementation of blockchain technology requires sophisticated cryptographic protocols.', 'technical', 'hard'),
        ('The protagonist faced a moral dilemma that would define his character.', 'literature', 'medium'),
        ('Her words carried the weight of generations of wisdom and experience.', 'literature', 'medium');
        
        RAISE NOTICE 'Sample sentences inserted successfully.';
    ELSE
        RAISE NOTICE 'English sentences already exist. Skipping insertion.';
    END IF;
END $$;`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Setup & Verification</h1>
          <p className="text-gray-600">Check and fix database table configuration</p>
        </div>

        {/* Supabase Project Info */}
        {supabaseInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Supabase Project Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Project URL</p>
                  <p className="text-sm font-mono">{supabaseInfo.url}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Project ID</p>
                  <p className="text-sm font-mono">{supabaseInfo.projectId}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${supabaseInfo.url}/project/default/editor`, "_blank")}
                  className="bg-transparent"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase SQL Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check Tables Button */}
        <div className="text-center">
          <Button onClick={checkDatabaseTables} disabled={isChecking} size="lg">
            {isChecking ? "Checking Tables..." : "Check Database Tables"}
          </Button>
        </div>

        {/* Table Status */}
        {tableChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Database Table Status</CardTitle>
              <CardDescription>Current status of required database tables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tableChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {check.exists ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{check.name}</p>
                        {check.error && <p className="text-sm text-red-600">{check.error}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.exists ? (
                        <>
                          <Badge className="bg-green-100 text-green-800">Exists</Badge>
                          {check.rowCount !== undefined && <Badge variant="outline">{check.rowCount} rows</Badge>}
                        </>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Missing</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Database Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to set up your database tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 1: Create Tables</h3>
              <p className="text-sm text-gray-600 mb-3">
                Run this SQL script in your Supabase SQL Editor to create all required tables:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">01-create-tables.sql</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyScript("Create Tables Script", createTablesScript)}
                    className="bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                  {createTablesScript.substring(0, 200)}...
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 2: Seed Sample Data</h3>
              <p className="text-sm text-gray-600 mb-3">Run this script to add sample English sentences:</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">02-seed-data.sql</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyScript("Seed Data Script", seedDataScript)}
                    className="bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                  {seedDataScript.substring(0, 200)}...
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 3: Verify Setup</h3>
              <p className="text-sm text-gray-600 mb-3">
                After running the scripts, click "Check Database Tables" above to verify everything is working.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/setup-profile")}
            className="bg-transparent"
          >
            Try Profile Setup Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/test")} className="bg-transparent">
            Run System Tests
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="bg-transparent">
            Back to Login
          </Button>
        </div>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> You need to run the database setup scripts in your Supabase SQL Editor before
            the profile setup will work. The scripts create the necessary tables and permissions.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
