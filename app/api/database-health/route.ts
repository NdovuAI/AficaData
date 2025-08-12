import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Basic connectivity
    const { data: sentences, error: sentencesError } = await supabase
      .from("english_sentences")
      .select("id, text_content, category, difficulty_level, created_at")
      .limit(5)

    if (sentencesError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: sentencesError.message,
        },
        { status: 500 },
      )
    }

    // Test 2: Count total sentences
    const { count: totalSentences, error: countError } = await supabase
      .from("english_sentences")
      .select("*", { count: "exact", head: true })

    // Test 3: Check categories and difficulties
    const { data: categoryData } = await supabase.from("english_sentences").select("category, difficulty_level")

    const categories = categoryData?.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    const difficulties = categoryData?.reduce((acc: any, item: any) => {
      acc[item.difficulty_level] = (acc[item.difficulty_level] || 0) + 1
      return acc
    }, {})

    // Test 4: Check other tables
    const { count: profilesCount } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

    const { count: translationsCount } = await supabase.from("translations").select("*", { count: "exact", head: true })

    // Test 5: Text analysis
    const textLengths = sentences?.map((s) => s.text_content.length) || []
    const avgLength = textLengths.length > 0 ? textLengths.reduce((a, b) => a + b, 0) / textLengths.length : 0

    const response = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalSentences: totalSentences || 0,
        sampleSentences: sentences?.length || 0,
      },
      content: {
        categories: categories || {},
        difficulties: difficulties || {},
        textAnalysis: {
          averageLength: Math.round(avgLength),
          minLength: textLengths.length > 0 ? Math.min(...textLengths) : 0,
          maxLength: textLengths.length > 0 ? Math.max(...textLengths) : 0,
        },
      },
      tables: {
        english_sentences: totalSentences || 0,
        user_profiles: profilesCount || 0,
        translations: translationsCount || 0,
      },
      sampleData: sentences?.slice(0, 3).map((s) => ({
        id: s.id,
        text: s.text_content.substring(0, 100) + (s.text_content.length > 100 ? "..." : ""),
        category: s.category,
        difficulty: s.difficulty_level,
      })),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database health check failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
