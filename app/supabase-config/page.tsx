"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Copy, ExternalLink, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SupabaseConfigPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
    setTimeout(() => setCopied(null), 2000)
  }

  const supabaseUrl = "https://wjvuyltpydxuqjvvbckm.supabase.co"
  const redirectUrls = [
    "http://localhost:3000/auth/callback",
    "https://yourdomain.com/auth/callback", // Replace with your production domain
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Supabase Configuration Guide</h1>
          <p className="text-gray-600">Complete setup instructions for email confirmation</p>
        </div>

        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Current Configuration
            </CardTitle>
            <CardDescription>Your Supabase project details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Project URL</p>
                  <p className="text-sm text-gray-600 font-mono">{supabaseUrl}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(supabaseUrl, "Project URL")}
                  className="bg-transparent"
                >
                  <Copy className="w-4 h-4" />
                  {copied === "Project URL" ? "Copied!" : "Copy"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Project ID</p>
                  <p className="text-sm text-gray-600 font-mono">wjvuyltpydxuqjvvbckm</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("wjvuyltpydxuqjvvbckm", "Project ID")}
                  className="bg-transparent"
                >
                  <Copy className="w-4 h-4" />
                  {copied === "Project ID" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Environment variables are configured correctly. The system should be able to connect to your Supabase
                project.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Required Supabase Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Required Supabase Dashboard Settings
            </CardTitle>
            <CardDescription>Configure these settings in your Supabase dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 1: Enable Email Confirmation</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </span>
                  <span>
                    Go to your{" "}
                    <a
                      href={`${supabaseUrl}/project/default/auth/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                    >
                      Supabase Dashboard → Authentication → Settings
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </span>
                  <span>
                    Find <strong>"Enable email confirmations"</strong> and make sure it's{" "}
                    <Badge className="bg-green-100 text-green-800">ON</Badge>
                  </span>
                </li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 2: Configure Redirect URLs</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </span>
                  <span>In the same Authentication Settings page, scroll down to "Redirect URLs"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </span>
                  <span>Add these URLs (one per line):</span>
                </li>
              </ol>

              <div className="mt-3 space-y-2">
                {redirectUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <code className="text-sm font-mono">{url}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(url, `Redirect URL ${index + 1}`)}
                      className="bg-transparent"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === `Redirect URL ${index + 1}` ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                ))}
              </div>

              <Alert className="mt-3">
                <AlertDescription>
                  <strong>Important:</strong> Replace "yourdomain.com" with your actual production domain when you
                  deploy.
                </AlertDescription>
              </Alert>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 3: Configure Email Templates (Optional)</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </span>
                  <span>
                    Go to{" "}
                    <a
                      href={`${supabaseUrl}/project/default/auth/templates`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                    >
                      Authentication → Email Templates
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </span>
                  <span>Customize the "Confirm signup" email template if desired</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Test the Configuration
            </CardTitle>
            <CardDescription>Verify that email confirmation is working</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  After completing the Supabase configuration above, test the email confirmation flow:
                </AlertDescription>
              </Alert>

              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </span>
                  <span>Go to the login page and create a new account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </span>
                  <span>Check your email for the confirmation message</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </span>
                  <span>Click the confirmation link - it should redirect back to your app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    4
                  </span>
                  <span>Complete your profile setup and start translating</span>
                </li>
              </ol>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => (window.location.href = "/")} className="bg-transparent">
                  Go to Login
                </Button>
                <Button
                  onClick={() => (window.location.href = "/debug-auth")}
                  variant="outline"
                  className="bg-transparent"
                >
                  Debug Auth
                </Button>
                <Button onClick={() => (window.location.href = "/test")} variant="outline" className="bg-transparent">
                  System Tests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Troubleshooting
            </CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Email confirmation link doesn't work</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Check that redirect URLs are configured correctly in Supabase</li>
                  <li>• Ensure "Enable email confirmations" is turned ON</li>
                  <li>• Verify the link hasn't expired (24-hour limit)</li>
                  <li>• Make sure you haven't already used the link</li>
                </ul>
              </div>

              <div className="border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Not receiving emails</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Verify the email address is correct</li>
                  <li>• Try with a different email provider (Gmail, Outlook, etc.)</li>
                  <li>• Check Supabase email rate limits</li>
                </ul>
              </div>

              <div className="border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Still having issues?</h4>
                <p className="text-sm text-blue-700">
                  Use the <strong>Debug Auth</strong> page to see detailed information about the authentication state
                  and identify specific issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
