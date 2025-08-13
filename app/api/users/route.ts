import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/users - List users (admin/validator only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view users
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!userProfile || !["admin", "validator"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const role = url.searchParams.get("role")
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")

    let query = supabase.from("user_profiles").select(`
        user_id,
        age,
        gender,
        county,
        education_level,
        occupation,
        native_languages,
        fluent_languages,
        role,
        status,
        created_at,
        updated_at,
        last_login,
        auth_users:user_id (email)
      `)

    // Apply filters
    if (role) query = query.eq("role", role)
    if (status) query = query.eq("status", status)
    if (search) {
      query = query.or(`occupation.ilike.%${search}%,county.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, error, count } = await query.range(from, to).order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Log activity
    await supabase.rpc("log_user_activity", {
      user_uuid: user.id,
      action_name: "view_users",
      resource_name: "users",
      activity_details: { page, limit, filters: { role, status, search } },
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin permission
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, role = "user", ...profileData } = body

    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: newUser.user.id,
        role,
        status: "active",
        ...profileData,
      })
      .select()
      .single()

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    // Log activity
    await supabase.rpc("log_user_activity", {
      user_uuid: user.id,
      action_name: "create_user",
      resource_name: "users",
      resource_uuid: newUser.user.id,
      activity_details: { email, role },
    })

    return NextResponse.json({ user: newUser.user, profile }, { status: 201 })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
