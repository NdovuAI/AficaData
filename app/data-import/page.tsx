"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function DataImportPage() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleImport = async () => {
    setImporting(true)
    setError("")
    setProgress(0)
    setStatus("Starting import...")

    try {
      // Step 1: Update schema
      setStatus("Updating database schema...")
      setProgress(25)

      // Step 2: Fetch and process CSV data
      setStatus("Fetching CSV data...")
      setProgress(50)

      const response = await fetch("/api/import-kalenjin-data", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to import data")
      }

      const result = await response.json()

      setProgress(75)
      setStatus("Processing translations...")

      // Step 3: Complete
      setProgress(100)
      setStatus(`Import completed successfully! Imported ${result.count} records.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStatus("Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Kalenjin Healthcare Data</CardTitle>
          <CardDescription>Import healthcare translation data from MedQuAD dataset into the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          {!importing && status && !error && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Data Source:</h3>
            <p className="text-sm text-muted-foreground">
              MedQuAD Healthcare Dataset - English to Kalenjin (Nandi dialect) translations
            </p>
            <p className="text-sm text-muted-foreground">
              This will import healthcare-related sentences and their Kalenjin translations
            </p>
          </div>

          <Button onClick={handleImport} disabled={importing} className="w-full">
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
