import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { sentence_id, user_translation, target_language, source_language, time_taken_seconds, user_id } = body

    let sentenceExists = false

    // First check english_sentences table
    const { data: englishSentence } = await supabase
      .from("english_sentences")
      .select("id")
      .eq("id", sentence_id)
      .single()

    if (englishSentence) {
      sentenceExists = true
    } else {
      // Check standard_sentences table
      const { data: standardSentence } = await supabase
        .from("standard_sentences")
        .select("id")
        .eq("id", sentence_id)
        .single()

      if (standardSentence) {
        sentenceExists = true
      }
    }

    if (!sentenceExists) {
      return NextResponse.json({ error: "Invalid sentence ID" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_translations")
      .insert({
        sentence_id: null, // Set to null to avoid foreign key constraint
        legacy_sentence_id: sentence_id, // Store the actual sentence ID here
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
