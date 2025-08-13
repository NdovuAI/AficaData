import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const language = searchParams.get("language") || "english"
    const category = searchParams.get("category") || null
    const difficulty = searchParams.get("difficulty") || null

    let query = supabase.from("standard_sentences").select("*").eq("original_language", language).eq("is_active", true)

    // Add optional filters
    if (category) {
      query = query.eq("category", category)
    }
    if (difficulty) {
      query = query.eq("difficulty_level", difficulty)
    }

    // Get random sentences
    const { data, error } = await query.limit(50)

    if (error || !data || data.length === 0) {
      console.log("Trying fallback to english_sentences table")

      const fallbackQuery = supabase.from("english_sentences").select("*").eq("is_active", true).limit(50)

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        console.error("Fallback query error:", fallbackError)
        return NextResponse.json({ error: "Failed to fetch sentence" }, { status: 500 })
      }

      if (!fallbackData || fallbackData.length === 0) {
        return NextResponse.json({ error: "No sentences found" }, { status: 404 })
      }

      // Pick a random sentence from the results
      const randomIndex = Math.floor(Math.random() * fallbackData.length)
      const randomSentence = {
        id: fallbackData[randomIndex].id,
        text: fallbackData[randomIndex].text_content,
        language: "english",
        category: fallbackData[randomIndex].category || "general",
        difficulty_level: fallbackData[randomIndex].difficulty_level || "intermediate",
        source: fallbackData[randomIndex].source || "system",
      }

      return NextResponse.json({ sentence: randomSentence })
    }

    // Pick a random sentence from the results
    const randomIndex = Math.floor(Math.random() * data.length)
    const selectedSentence = data[randomIndex]

    const randomSentence = {
      id: selectedSentence.id,
      text: selectedSentence.original_text,
      language: selectedSentence.original_language,
      category: selectedSentence.category || "general",
      difficulty_level: selectedSentence.difficulty_level || "intermediate",
      source: selectedSentence.source || "system",
    }

    return NextResponse.json({ sentence: randomSentence })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
