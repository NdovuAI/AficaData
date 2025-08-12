"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, ExternalLink } from "lucide-react"

const AFRICAN_LANGUAGES = [
  { code: "sw", name: "Swahili" },
  { code: "luo", name: "Luo" },
  { code: "kik", name: "Kikuyu" },
  { code: "kal", name: "Kalenjin" },
  { code: "som", name: "Somali" },
  { code: "luy", name: "Luhya" },
  { code: "kam", name: "Kamba" },
  { code: "mer", name: "Meru" },
  { code: "kis", name: "Kisii" },
  { code: "tuk", name: "Turkana" },
]

const COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Garissa",
  "Kakamega",
  "Meru",
  "Nyeri",
  "Machakos",
  "Kericho",
  "Embu",
  "Migori",
  "Homa Bay",
  "Naivasha",
  "Voi",
  "Kilifi",
]

export default function SetupProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [databaseError, setDatabaseError] = useState<any>(null)
  const [isCheckingDatabase, setIsCheckingDatabase] = useState(true)
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    county: "",
    education_level: "",
    occupation: "",
    native_languages: [] as string[],
    fluent_languages: [] as string[],
    mpesa_number: "",
  })
  const [showForm, setShowForm] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    initializeProfile()
  }, [])

  const initializeProfile = async () => {
    try {
      setIsCheckingDatabase(true)

      const supabaseClient = createClient()

      // First, get the authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser()

      console.log("Setup Profile - User check:", { user: user?.email, error: userError })

      if (userError) {
        console.error("User authentication error:", userError)
        setDatabaseError({
          type: "auth_error",
          message: "Authentication error",
          details: userError.message,
          solution: "Please try logging in again",
        })
        return
      }

      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/")
        return
      }

      setUser(user)

      console.log("Testing database connectivity...")

      try {
        // Test database connectivity with a simple query that doesn't rely on schema cache
        const { data, error: connectivityError } = await supabaseClient
          .from("user_profiles")
          .select("id")
          .limit(1)
          .maybeSingle()

        if (connectivityError) {
          // Handle specific error types
          const isTableMissing =
            connectivityError.message?.includes("Could not find the table") ||
            connectivityError.message?.includes("schema cache") ||
            connectivityError.code === "42P01" ||
            connectivityError.code === "PGRST106"

          if (isTableMissing) {
            console.error("Database tables not found:", connectivityError)
            setDatabaseError({
              type: "tables_missing",
              message: "Database tables not found",
              details: connectivityError.message,
              solution: "The required database tables are missing. Please contact support to set up the database.",
            })
            return
          }

          // Handle RLS policy issues
          const isRLSIssue =
            connectivityError.message?.includes("RLS") ||
            connectivityError.message?.includes("policy") ||
            connectivityError.code === "42501"

          if (isRLSIssue) {
            console.error("RLS policy error:", connectivityError)
            setDatabaseError({
              type: "rls_error",
              message: "Database access denied",
              details: connectivityError.message,
              solution: "Database access is restricted. Please contact support.",
            })
            return
          }

          // Other database errors
          console.error("Database connection failed:", connectivityError)
          setDatabaseError({
            type: "connection_error",
            message: "Cannot connect to database",
            details: connectivityError.message,
            solution: "Database connection failed. Please check your internet connection and try again.",
          })
          return
        }

        console.log("Database connection successful, checking for existing profile...")

        const { data: existingProfile, error: profileError } = await supabaseClient
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Profile check error:", profileError)
          setDatabaseError({
            type: "database_error",
            message: "Profile check failed",
            details: profileError.message,
            solution: "Unable to check existing profile. Please try again.",
          })
          return
        }

        if (existingProfile) {
          console.log("Existing profile found, redirecting to translator dashboard")
          router.push("/translator")
          return
        }

        console.log("No existing profile found, showing profile setup form")
        setShowForm(true)
      } catch (err: any) {
        console.error("Unexpected error during database connectivity test:", err)
        setDatabaseError({
          type: "connection_error",
          message: "Unexpected error",
          details: err.message || "An unexpected error occurred",
          solution: "Please refresh the page and try again.",
        })
      }
    } catch (err: any) {
      console.error("Profile initialization error:", err)
      setDatabaseError({
        type: "initialization_error",
        message: "Failed to initialize profile setup",
        details: err.message || "An unexpected error occurred",
        solution: "Please refresh the page and try again.",
      })
    } finally {
      setIsCheckingDatabase(false)
    }
  }

  const handleLanguageChange = (languageCode: string, type: "native" | "fluent", checked: boolean) => {
    setFormData((prev) => {
      const key = type === "native" ? "native_languages" : "fluent_languages"
      const currentLanguages = prev[key]

      if (checked) {
        return {
          ...prev,
          [key]: [...currentLanguages, languageCode],
        }
      } else {
        return {
          ...prev,
          [key]: currentLanguages.filter((lang) => lang !== languageCode),
        }
      }
    })
  }

  const validateForm = () => {
    const errors = []

    if (!formData.age || Number.parseInt(formData.age) < 18 || Number.parseInt(formData.age) > 100) {
      errors.push("Please enter a valid age between 18 and 100")
    }
    if (!formData.gender) errors.push("Please select your gender")
    if (!formData.county) errors.push("Please select your county")
    if (!formData.education_level) errors.push("Please select your education level")
    if (!formData.occupation.trim()) errors.push("Please enter your occupation")
    if (!formData.mpesa_number.trim()) errors.push("Please enter your M-Pesa number")
    if (formData.native_languages.length === 0) errors.push("Please select at least one native language")

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors[0],
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("Submitting profile data:", { userId: user.id, formData })

    try {
      // Prepare the data for insertion
      const profileData = {
        user_id: user.id,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        county: formData.county,
        education_level: formData.education_level,
        occupation: formData.occupation.trim(),
        native_languages: formData.native_languages,
        fluent_languages: formData.fluent_languages,
        mpesa_number: formData.mpesa_number.trim(),
        role: "translator",
      }

      console.log("Inserting profile data:", profileData)

      const { data, error } = await supabase.from("user_profiles").insert(profileData).select().single()

      console.log("Profile insertion result:", { data, error })

      if (error) {
        console.error("Profile insertion error:", error)
        toast({
          title: "Database Error",
          description: `Failed to save profile: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("Profile created successfully:", data)

      toast({
        title: "Success",
        description: "Profile setup completed successfully!",
      })

      // Small delay to ensure the toast is visible
      setTimeout(() => {
        console.log("Redirecting to translate page")
        router.push("/translate")
      }, 1000)
    } catch (error: any) {
      console.error("Unexpected error during profile creation:", error)
      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking database
  if (isCheckingDatabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center">
              <Database className="w-8 h-8 mx-auto mb-4 animate-pulse text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Initializing Profile Setup</h3>
              <p className="text-gray-600 mb-4">Checking database connection and user authentication...</p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show database error state
  if (databaseError) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectId = supabaseUrl?.split("//")[1]?.split(".")[0]

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              {databaseError.type === "tables_missing" ? "Database Setup Required" : "Setup Error"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {databaseError.message}
                <br />
                <strong>Details:</strong> {databaseError.details}
              </AlertDescription>
            </Alert>

            {databaseError.type === "tables_missing" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Tables Missing
                </h3>
                <p className="text-blue-800 mb-4">
                  The required database tables haven't been created yet. This is a one-time setup that needs to be done
                  in your Supabase project.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-900 mb-2">Manual Setup</h4>
                    <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                      <li>
                        Open your{" "}
                        {supabaseUrl && (
                          <a
                            href={`${supabaseUrl}/project/default/editor`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            Supabase SQL Editor
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </li>
                      <li>Copy and run the table creation script from the scripts folder</li>
                      <li>Copy and run the data seeding script</li>
                      <li>Return here and refresh the page</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {databaseError.type === "rls_error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Database Access Denied
                </h3>
                <p className="text-red-800 mb-4">
                  Row Level Security policies may be blocking access to the database. Please check your Supabase RLS
                  settings.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full bg-transparent">
                Retry After Setup
              </Button>

              <div className="grid grid-cols-1 gap-2">
                <Button onClick={() => router.push("/")} variant="outline" className="bg-transparent">
                  Back to Login
                </Button>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Technical Debug Information
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                <pre className="overflow-auto">
                  {JSON.stringify(
                    {
                      errorType: databaseError.type,
                      message: databaseError.message,
                      details: databaseError.details,
                      supabaseUrl,
                      projectId,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show the profile setup form
  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Welcome {user?.email}! Please provide your demographic information and language preferences to get
                started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="100"
                      value={formData.age}
                      onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="county">County *</Label>
                    <Select
                      value={formData.county}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, county: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTIES.map((county) => (
                          <SelectItem key={county} value={county.toLowerCase()}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Education Level *</Label>
                    <Select
                      value={formData.education_level}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, education_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="degree">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    type="text"
                    placeholder="e.g., Teacher, Student, Engineer"
                    value={formData.occupation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpesa">M-Pesa Number *</Label>
                  <Input
                    id="mpesa"
                    type="tel"
                    placeholder="+254700000000"
                    value={formData.mpesa_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mpesa_number: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Native Languages *</Label>
                    <p className="text-sm text-gray-600 mb-3">Select the languages you speak as a native speaker</p>
                    <div className="grid grid-cols-2 gap-2">
                      {AFRICAN_LANGUAGES.map((language) => (
                        <div key={`native-${language.code}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`native-${language.code}`}
                            checked={formData.native_languages.includes(language.code)}
                            onCheckedChange={(checked) =>
                              handleLanguageChange(language.code, "native", checked as boolean)
                            }
                          />
                          <Label htmlFor={`native-${language.code}`} className="text-sm">
                            {language.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Fluent Languages</Label>
                    <p className="text-sm text-gray-600 mb-3">Select additional languages you can translate fluently</p>
                    <div className="grid grid-cols-2 gap-2">
                      {AFRICAN_LANGUAGES.map((language) => (
                        <div key={`fluent-${language.code}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fluent-${language.code}`}
                            checked={formData.fluent_languages.includes(language.code)}
                            onCheckedChange={(checked) =>
                              handleLanguageChange(language.code, "fluent", checked as boolean)
                            }
                          />
                          <Label htmlFor={`fluent-${language.code}`} className="text-sm">
                            {language.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All fields marked with * are required. Make sure to select at least one native language.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Setting up profile..." : "Complete Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
