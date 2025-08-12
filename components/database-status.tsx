"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw, Database, FileText, Users } from "lucide-react"

interface DatabaseHealth {
  status: string
  database: {
    connected: boolean
    totalSentences: number
    sampleSentences: number
  }
  content: {
    categories: { [key: string]: number }
    difficulties: { [key: string]: number }
    textAnalysis: {
      averageLength: number
      minLength: number
      maxLength: number
    }
  }
  tables: {
    english_sentences: number
    user_profiles: number
    translations: number
  }
  sampleData: Array<{
    id: string
    text: string
    category: string
    difficulty: string
  }>
}

export function DatabaseStatus() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkDatabaseHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database-health")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Health check failed")
      }

      setHealth(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseHealth()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking database health...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <XCircle className="w-5 h-5" />
            Database Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={checkDatabaseHealth} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!health) return null

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health.status === "healthy" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Database Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Connection</span>
              </div>
              <Badge variant={health.database.connected ? "default" : "destructive"}>
                {health.database.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Sentences</span>
              </div>
              <div className="text-lg font-bold">{health.database.totalSentences}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Profiles</span>
              </div>
              <div className="text-lg font-bold">{health.tables.user_profiles}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(health.content.categories).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Difficulties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(health.content.difficulties).map(([difficulty, count]) => (
                <div key={difficulty} className="flex justify-between items-center">
                  <Badge
                    className={
                      difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {difficulty}
                  </Badge>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Sentences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {health.sampleData.map((sample, index) => (
              <div key={sample.id} className="border-l-4 border-blue-500 pl-3">
                <div className="flex gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {sample.category}
                  </Badge>
                  <Badge
                    className={`text-xs ${
                      sample.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : sample.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sample.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{sample.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <Button onClick={checkDatabaseHealth} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  )
}
