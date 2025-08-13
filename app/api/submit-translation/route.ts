import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { sentence_id, user_translation, target_language, source_language, time_taken_seconds, user_id } = body

    const { data, error } = await supabase
      .from("user_translations")
      .insert({
        sentence_id,
        user_translation,
        target_language,
        source_language,
        time_taken_seconds,
        user_id,
        is_correct: null, // Will be determined by reviewers
        score: null, // Will be assigned by reviewers
      })
      .select()
      .single()

    if (error) {
      console.error("Error submitting translation:", error)
      return NextResponse.json({ error: "Failed to submit translation" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      translation_id: data.id,
      message: "Translation submitted for review",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
