import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/users/[id] - Get user details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetUserId = params.id

    // Check permissions - users can view their own profile, validators/admins can view others
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    const canViewOthers = userProfile && ["admin", "validator"].includes(userProfile.role)
    const isOwnProfile = user.id === targetUserId

    if (!isOwnProfile && !canViewOthers) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Fetch user profile with auth data
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select(`
        *,
        auth_users:user_id (email, created_at, last_sign_in_at)
      `)
      .eq("user_id", targetUserId)
      .single()

    if (error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log activity
    await supabase.rpc("log_user_activity", {
      user_uuid: user.id,
      action_name: "view_user",
      resource_name: "users",
      resource_uuid: targetUserId,
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetUserId = params.id
    const body = await request.json()

    // Check permissions
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    const isAdmin = userProfile?.role === "admin"
    const isOwnProfile = user.id === targetUserId

    // Users can only update their own profile (except role/status)
    // Admins can update any profile
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Restrict role/status changes to admins only
    if (!isAdmin && (body.role || body.status)) {
      return NextResponse.json({ error: "Only admins can change role or status" }, { status: 403 })
    }

    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log activity
    await supabase.rpc("log_user_activity", {
      user_uuid: user.id,
      action_name: "update_user",
      resource_name: "users",
      resource_uuid: targetUserId,
      activity_details: { changes: Object.keys(body) },
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: any) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const targetUserId = params.id

    // Prevent self-deletion
    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete user profile first (due to foreign key constraints)
    const { error: profileError } = await supabase.from("user_profiles").delete().eq("user_id", targetUserId)

    if (profileError) {
      return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 })
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
      console.error("Failed to delete auth user:", authDeleteError)
      // Profile is already deleted, so we continue
    }

    // Log activity
    await supabase.rpc("log_user_activity", {
      user_uuid: user.id,
      action_name: "delete_user",
      resource_name: "users",
      resource_uuid: targetUserId,
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
