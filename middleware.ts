import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables not configured properly")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  let supabase
  try {
    supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return NextResponse.next({
      request,
    })
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error("Auth error in middleware:", error)
    return NextResponse.next({
      request,
    })
  }

  // Protect routes that require authentication
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/translate") || request.nextUrl.pathname.startsWith("/setup-profile"))
  ) {
    // Redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (user && request.nextUrl.pathname === "/") {
    try {
      // Check if user has completed profile setup
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      const url = request.nextUrl.clone()
      if (!profile) {
        url.pathname = "/setup-profile"
      } else {
        url.pathname = "/translate"
      }
      return NextResponse.redirect(url)
    } catch (error) {
      console.error("Database error in middleware:", error)
      // If database error, redirect to setup-profile to handle it
      const url = request.nextUrl.clone()
      url.pathname = "/setup-profile"
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback route)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
