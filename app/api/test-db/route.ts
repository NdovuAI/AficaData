import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection and data
    const { data: sentences, error: sentencesError } = await supabase.from("english_sentences").select("*").limit(5)

    if (sentencesError) {
      return NextResponse.json({ error: "Database connection failed", details: sentencesError }, { status: 500 })
    }

    // Test user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    const response = {
      database: {
        connected: true,
        sentencesCount: sentences?.length || 0,
        sampleSentence: sentences?.[0]?.text_content || null,
      },
      auth: {
        user: user
          ? {
              id: user.id,
              email: user.email,
              authenticated: true,
            }
          : {
              authenticated: false,
            },
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: "System test failed", details: error.message }, { status: 500 })
  }
}
