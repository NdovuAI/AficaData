"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database } from "lucide-react"

interface DatabaseStatus {
  isHealthy: boolean
  missingTables: string[]
  error?: string
}

export function DatabaseChecker({ onStatusChange }: { onStatusChange?: (status: DatabaseStatus) => void }) {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    const requiredTables = ["user_profiles", "english_sentences", "translations", "translation_reviews"]
    const missingTables: string[] = []
    let error: string | undefined

    try {
      for (const table of requiredTables) {
        try {
          const { data, error: tableError } = await supabase.from(table).select("id").limit(1)

          if (tableError) {
            if (
              tableError.message?.includes("Could not find the table") ||
              tableError.message?.includes(table) ||
              tableError.message?.includes("schema cache") ||
              tableError.code === "42P01" ||
              tableError.code === "PGRST106"
            ) {
              missingTables.push(table)
            } else {
              error = tableError.message
            }
          }
        } catch (tableError: any) {
          if (
            tableError.message?.includes("Could not find the table") ||
            tableError.message?.includes(table) ||
            tableError.code === "42P01"
          ) {
            missingTables.push(table)
          } else {
            error = tableError.message
          }
        }
      }

      const newStatus: DatabaseStatus = {
        isHealthy: missingTables.length === 0 && !error,
        missingTables,
        error,
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (err: any) {
      const errorStatus: DatabaseStatus = {
        isHealthy: false,
        missingTables: [],
        error: err.message,
      }
      setStatus(errorStatus)
      onStatusChange?.(errorStatus)
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <Alert>
        <Database className="h-4 w-4 animate-pulse" />
        <AlertDescription>Checking database status...</AlertDescription>
      </Alert>
    )
  }

  if (!status) return null

  if (status.isHealthy) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Database is properly configured and ready to use.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <p>
            <strong>Database Setup Required:</strong>{" "}
            {status.missingTables.length > 0 ? `Missing tables: ${status.missingTables.join(", ")}` : status.error}
          </p>
          <p className="text-sm">Please contact support if this issue persists.</p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
