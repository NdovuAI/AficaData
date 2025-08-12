"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Email Verification Failed</CardTitle>
          <CardDescription>
            {error ? `Error: ${error}` : "There was an error verifying your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Common Issues:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• The verification link has expired (links expire after 24 hours)</li>
              <li>• The link has already been used</li>
              <li>• Email confirmation is disabled in your Supabase project</li>
              <li>• Incorrect redirect URL configuration</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-semibold">Try these solutions:</p>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Go back and sign up again with a fresh email</li>
              <li>2. Check if you already have an account and try signing in</li>
              <li>3. Make sure email confirmation is enabled in Supabase</li>
              <li>4. Contact support if the problem persists</li>
            </ol>
          </div>

          <div className="flex gap-2 pt-4">
            <Button asChild className="flex-1">
              <Link href="/">Back to Login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/test">Test System</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
