"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { rbac, type UserRole } from "@/lib/rbac"
import { useRouter } from "next/navigation"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: { action: string; resource: string }
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = "/translate",
}: RoleGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      let access = true

      if (requiredRole) {
        access = await rbac.requireRole(user.id, requiredRole)
      }

      if (requiredPermission && access) {
        access = await rbac.checkPermission(user.id, requiredPermission.action, requiredPermission.resource)
      }

      setHasAccess(access)

      if (!access && redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error("Role guard error:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
