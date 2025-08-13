import { createClient } from "@/lib/supabase/client"

export type UserRole = "user" | "validator" | "admin"

export interface Permission {
  action: string
  resource: string
}

// Role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { action: "translate", resource: "sentences" },
    { action: "view", resource: "own_translations" },
    { action: "update", resource: "own_profile" },
    { action: "view", resource: "own_statistics" },
  ],
  validator: [
    // Includes all user permissions
    { action: "translate", resource: "sentences" },
    { action: "view", resource: "own_translations" },
    { action: "update", resource: "own_profile" },
    { action: "view", resource: "own_statistics" },
    // Plus validator-specific permissions
    { action: "review", resource: "translations" },
    { action: "approve", resource: "translations" },
    { action: "reject", resource: "translations" },
    { action: "view", resource: "all_translations" },
    { action: "view", resource: "user_statistics" },
  ],
  admin: [
    // Full system access
    { action: "manage", resource: "users" },
    { action: "manage", resource: "validators" },
    { action: "manage", resource: "translations" },
    { action: "manage", resource: "sentences" },
    { action: "view", resource: "all_statistics" },
    { action: "manage", resource: "system_settings" },
    { action: "view", resource: "audit_logs" },
    { action: "manage", resource: "roles" },
  ],
}

export class RBACManager {
  private supabase = createClient()

  async getUserRole(userId: string): Promise<UserRole> {
    try {
      const { data, error } = await this.supabase
        .from("user_profiles")
        .select("role, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (error || !data) {
        return "user" // Default role
      }

      return data.role as UserRole
    } catch (error) {
      console.error("Error getting user role:", error)
      return "user"
    }
  }

  async checkPermission(userId: string, action: string, resource: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId)

      // Admin has all permissions
      if (role === "admin") {
        return true
      }

      // Check if role has specific permission
      const permissions = ROLE_PERMISSIONS[role] || []
      return permissions.some((p) => p.action === action && p.resource === resource)
    } catch (error) {
      console.error("Error checking permission:", error)
      return false
    }
  }

  async requireRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId)

    // Role hierarchy: admin > validator > user
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      validator: 2,
      admin: 3,
    }

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  async requirePermission(userId: string, action: string, resource: string): Promise<void> {
    const hasPermission = await this.checkPermission(userId, action, resource)

    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${action} on ${resource}`)
    }
  }
}

// Singleton instance
export const rbac = new RBACManager()

// Helper functions for common checks
export async function requireAdmin(userId: string): Promise<void> {
  const hasAccess = await rbac.requireRole(userId, "admin")
  if (!hasAccess) {
    throw new Error("Admin access required")
  }
}

export async function requireValidator(userId: string): Promise<void> {
  const hasAccess = await rbac.requireRole(userId, "validator")
  if (!hasAccess) {
    throw new Error("Validator access required")
  }
}

export async function getUserWithRole(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, auth_users:user_id(email)")
    .eq("user_id", userId)
    .single()

  if (error) {
    throw new Error("User not found")
  }

  return data
}
