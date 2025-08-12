import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  // Handle error from Supabase
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`,
    )
  }

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`,
        )
      }

      if (data.user) {
        console.log("User authenticated successfully:", data.user.email)

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile check error:", profileError)
        }

        if (!profile) {
          console.log("No profile found, redirecting to setup")
          return NextResponse.redirect(`${origin}/setup-profile`)
        } else {
          console.log("Profile found, redirecting to translate")
          return NextResponse.redirect(`${origin}/translate`)
        }
      }
    } catch (error: any) {
      console.error("Unexpected auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }
  }

  // If no code and no error, something went wrong
  console.error("Auth callback called without code or error")
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=${encodeURIComponent("No authorization code received")}`,
  )
}
