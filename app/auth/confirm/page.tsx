"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!token_hash || !type) {
          setStatus("error")
          setMessage("Invalid confirmation link")
          return
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })

        if (error) {
          setStatus("error")
          setMessage(error.message)
        } else {
          setStatus("success")
          setMessage("Email confirmed successfully! You can now sign in.")

          // Redirect to setup profile after a short delay
          setTimeout(() => {
            router.push("/setup-profile")
          }, 2000)
        }
      } catch (error: any) {
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }

    confirmEmail()
  }, [searchParams, supabase, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4">
            {status === "loading" && (
              <div className="bg-blue-100">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>

          <CardTitle>
            {status === "loading" && "Confirming Email..."}
            {status === "success" && "Email Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </CardTitle>

          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Redirecting you to complete your profile setup...</p>
              <Button onClick={() => router.push("/setup-profile")} className="w-full">
                Continue to Profile Setup
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Button onClick={() => router.push("/")} className="w-full">
                Back to Login
              </Button>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Please wait while we verify your email...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
