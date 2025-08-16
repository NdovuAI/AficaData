"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { LogOut, RefreshCw, Send, Globe, Mic } from "lucide-react"
import { DatabaseStatus } from "@/components/database-status"

const KALENJIN_DIALECTS = [
  { code: "nandi", name: "Nandi" },
  { code: "kipsigis", name: "Kipsigis" },
  { code: "tugen", name: "Tugen" },
  { code: "marakwet", name: "Marakwet" },
]

const SOURCE_LANGUAGES = [
  { code: "english", name: "English" },
  { code: "kiswahili", name: "Kiswahili" },
]

interface StandardSentence {
  id: string
  text: string
  language: string
  category: string
  difficulty_level: string
  source: string
}

interface UserStats {
  total_translations: number
  correct_translations: number
  accuracy_percentage: number
  average_score: number
  languages_practiced: string[]
}

export default function TranslatePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currentSentence, setCurrentSentence] = useState<StandardSentence | null>(null)
  const [sourceLanguage, setSourceLanguage] = useState("english")
  const [targetLanguage, setTargetLanguage] = useState("kalenjin")
  const [selectedDialect, setSelectedDialect] = useState("nandi")
  const [translation, setTranslation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    total_translations: 0,
    correct_translations: 0,
    accuracy_percentage: 0,
    average_score: 0,
    languages_practiced: [],
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
      } else {
        setUser(user)

        // Get user profile
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

        if (!profile) {
          router.push("/setup-profile")
        } else {
          setUserProfile(profile)
          if (profile.native_languages && profile.native_languages.includes("kalenjin")) {
            setTargetLanguage("kalenjin")
          }
          loadUserStats(user.id)
        }
      }
    }
    getUser()
  }, [router, supabase])

  const loadUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_translations").select("*").eq("user_id", userId)

      if (error) throw error

      if (data) {
        const totalTranslations = data.length
        const correctTranslations = data.filter((t) => t.is_correct === true).length
        const accuracyPercentage = totalTranslations > 0 ? (correctTranslations / totalTranslations) * 100 : 0
        const averageScore = data.length > 0 ? data.reduce((sum, t) => sum + (t.score || 0), 0) / data.length : 0
        const languagesPracticed = [...new Set(data.map((t) => t.target_language))]

        setUserStats({
          total_translations: totalTranslations,
          correct_translations: correctTranslations,
          accuracy_percentage: accuracyPercentage,
          average_score: averageScore,
          languages_practiced: languagesPracticed,
        })
      }
    } catch (error: any) {
      console.error("Error loading user stats:", error)
    }
  }

  const fetchRandomSentence = async () => {
    if (!sourceLanguage || !user) return

    setIsLoading(true)
    setStartTime(new Date())
    try {
      const response = await fetch(`/api/random-sentence?language=${sourceLanguage}&category=&difficulty=`)

      if (!response.ok) {
        throw new Error("Failed to fetch sentence")
      }

      const data = await response.json()

      if (data.sentence) {
        setCurrentSentence(data.sentence)
        setTranslation("")
      } else {
        toast({
          title: "No sentences available",
          description: "No sentences found for the selected criteria.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const submitTranslation = async () => {
    if (!currentSentence || !translation.trim() || !user || !targetLanguage) return

    setIsSubmitting(true)
    try {
      const timeTaken = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : null

      const response = await fetch("/api/submit-translation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sentence_id: currentSentence.id,
          user_translation: translation.trim(),
          source_language: sourceLanguage,
          target_language: `${targetLanguage}_${selectedDialect}`,
          time_taken_seconds: timeTaken,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit translation")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: "Translation submitted for review! Your contribution helps build African language resources.",
      })

      // Reset form and load new sentence
      setTranslation("")
      setCurrentSentence(null)
      setStartTime(null)
      loadUserStats(user.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getAvailableTargetLanguages = () => {
    if (!userProfile) return []

    const languages = []

    // Add Kiswahili if user is fluent
    if (userProfile.fluent_languages?.includes("kiswahili")) {
      languages.push({ code: "kiswahili", name: "Kiswahili" })
    }

    // Add native languages
    if (userProfile.native_languages?.includes("kalenjin")) {
      languages.push({ code: "kalenjin", name: "Kalenjin" })
    }

    return languages
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "news":
        return "bg-blue-100 text-blue-800"
      case "healthcare":
        return "bg-green-100 text-green-800"
      case "general":
        return "bg-purple-100 text-purple-800"
      case "conversation":
        return "bg-orange-100 text-orange-800"
      case "technical":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!user || !userProfile) return null

  const availableTargetLanguages = getAvailableTargetLanguages()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Translation Practice</h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/voice-recording")}>
              <Mic className="w-4 h-4 mr-2" />
              Voice Recording
            </Button>
            <Button variant="outline" onClick={() => router.push("/settings")}>
              Settings
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Database Status */}
        <div className="mb-6">
          <DatabaseStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{userStats.total_translations}</div>
              <div className="text-sm text-gray-600">Total Translations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{userStats.correct_translations}</div>
              <div className="text-sm text-gray-600">Correct Translations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{userStats.accuracy_percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{userStats.average_score.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Translation Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Multilingual Translation Practice
            </CardTitle>
            <CardDescription>
              Practice translating between English, Kiswahili, and your native language to help build African language
              resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-language">Source Language</Label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-language">Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargetLanguages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetLanguage === "kalenjin" && (
                <div className="space-y-2">
                  <Label htmlFor="dialect">Kalenjin Dialect</Label>
                  <Select value={selectedDialect} onValueChange={setSelectedDialect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dialect" />
                    </SelectTrigger>
                    <SelectContent>
                      {KALENJIN_DIALECTS.map((dialect) => (
                        <SelectItem key={dialect.code} value={dialect.code}>
                          {dialect.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Get New Sentence Button */}
            <div className="flex gap-2">
              <Button onClick={fetchRandomSentence} disabled={!sourceLanguage || isLoading} className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Loading..." : "Get New Sentence"}
              </Button>
            </div>

            {/* Current Sentence */}
            {currentSentence && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-2 mb-3">
                    <Badge className={getCategoryColor(currentSentence.category)}>{currentSentence.category}</Badge>
                    <Badge className={getDifficultyColor(currentSentence.difficulty_level)}>
                      {currentSentence.difficulty_level}
                    </Badge>
                    <Badge variant="outline">{currentSentence.source}</Badge>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {SOURCE_LANGUAGES.find((l) => l.code === currentSentence.language)?.name}:
                    </span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{currentSentence.text}</p>
                </div>

                {/* Translation Input */}
                <div className="space-y-2">
                  <Label htmlFor="translation">
                    Your Translation ({availableTargetLanguages.find((l) => l.code === targetLanguage)?.name}
                    {targetLanguage === "kalenjin" &&
                      ` - ${KALENJIN_DIALECTS.find((d) => d.code === selectedDialect)?.name}`}
                    )
                  </Label>
                  <Textarea
                    id="translation"
                    placeholder={`Enter your ${targetLanguage === "kalenjin" ? "Kalenjin" : "Kiswahili"} translation here...`}
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button onClick={submitTranslation} disabled={!translation.trim() || isSubmitting} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Translation for Review"}
                </Button>
              </div>
            )}

            {!currentSentence && sourceLanguage && (
              <div className="text-center py-8 text-gray-500">
                Click "Get New Sentence" to start translating from{" "}
                {SOURCE_LANGUAGES.find((l) => l.code === sourceLanguage)?.name} to your selected target language
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
