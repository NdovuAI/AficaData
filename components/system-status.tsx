"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SystemStatus {
  database: boolean
  auth: boolean
  sentences: number
  translations: number
  users: number
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const supabase = createClient()

  const checkSystemStatus = async () => {
    setLoading(true)
    try {
      // Check database connection
      const { data: sentences, error: sentencesError } = await supabase.from("english_sentences").select("id")

      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get counts
      const { count: sentencesCount } = await supabase
        .from("english_sentences")
        .select("*", { count: "exact", head: true })

      const { count: translationsCount } = await supabase
        .from("translations")
        .select("*", { count: "exact", head: true })

      const { count: usersCount } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

      setStatus({
        database: !sentencesError,
        auth: !!user,
        sentences: sentencesCount || 0,
        translations: translationsCount || 0,
        users: usersCount || 0,
      })

      setLastChecked(new Date())
    } catch (error) {
      console.error("Status check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  if (!status && loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">System Status</CardTitle>
          <Button variant="outline" size="sm" onClick={checkSystemStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Database Connection</span>
          <Badge variant={status?.database ? "default" : "destructive"}>
            {status?.database ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {status?.database ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Authentication</span>
          <Badge variant={status?.auth ? "default" : "secondary"}>
            {status?.auth ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {status?.auth ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{status?.sentences || 0}</div>
            <div className="text-xs text-gray-600">Sentences</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{status?.translations || 0}</div>
            <div className="text-xs text-gray-600">Translations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{status?.users || 0}</div>
            <div className="text-xs text-gray-600">Users</div>
          </div>
        </div>

        {lastChecked && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
