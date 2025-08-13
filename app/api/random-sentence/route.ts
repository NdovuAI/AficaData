import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const language = searchParams.get("language") || "english"
    const category = searchParams.get("category") || null
    const difficulty = searchParams.get("difficulty") || null

    const { data, error } = await supabase.rpc("get_random_sentence_for_translation", {
      p_language: language,
      p_category: category,
      p_difficulty: difficulty,
    })

    if (error) {
      console.error("Error fetching random sentence:", error)
      return NextResponse.json({ error: "Failed to fetch sentence" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No sentences found" }, { status: 404 })
    }

    return NextResponse.json({ sentence: data[0] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
