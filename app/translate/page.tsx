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
import { LogOut, RefreshCw, Send } from "lucide-react"
import { DatabaseStatus } from "@/components/database-status"

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

interface EnglishSentence {
  id: string
  text_content: string
  category: string
  difficulty_level: string
}

interface UserStats {
  total_translations: number
  pending_reviews: number
  approved_translations: number
  rejected_translations: number
}

export default function TranslatePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currentSentence, setCurrentSentence] = useState<EnglishSentence | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [translation, setTranslation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userStats, setUserStats] = useState<UserStats>({
    total_translations: 0,
    pending_reviews: 0,
    approved_translations: 0,
    rejected_translations: 0,
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
          loadUserStats(user.id)
        }
      }
    }
    getUser()
  }, [router, supabase])

  const loadUserStats = async (userId: string) => {
    const { data: translations } = await supabase
      .from("translations")
      .select("review_status")
      .eq("translator_id", userId)

    if (translations) {
      const stats = translations.reduce(
        (acc, t) => {
          acc.total_translations++
          if (t.review_status === "pending") acc.pending_reviews++
          if (t.review_status === "approved") acc.approved_translations++
          if (t.review_status === "rejected") acc.rejected_translations++
          return acc
        },
        {
          total_translations: 0,
          pending_reviews: 0,
          approved_translations: 0,
          rejected_translations: 0,
        },
      )
      setUserStats(stats)
    }
  }

  const fetchRandomSentence = async () => {
    if (!selectedLanguage || !user) return

    setIsLoading(true)
    try {
      // Get a random English sentence that hasn't been translated by this user in the selected language
      const { data: sentences, error } = await supabase
        .from("english_sentences")
        .select(`
          id,
          text_content,
          category,
          difficulty_level
        `)
        .eq("is_active", true)
        .not(
          "id",
          "in",
          `(
          SELECT english_sentence_id 
          FROM translations 
          WHERE translator_id = '${user.id}' 
          AND target_language = '${selectedLanguage}'
        )`,
        )
        .limit(10)

      if (error) throw error

      if (sentences && sentences.length > 0) {
        // Pick a random sentence from the results
        const randomIndex = Math.floor(Math.random() * sentences.length)
        setCurrentSentence(sentences[randomIndex])
        setTranslation("")
      } else {
        toast({
          title: "No sentences available",
          description: "You have translated all available sentences in this language.",
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
    if (!currentSentence || !translation.trim() || !user || !selectedLanguage) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("translations").insert({
        english_sentence_id: currentSentence.id,
        translator_id: user.id,
        translated_text: translation.trim(),
        target_language: selectedLanguage,
        review_status: "pending",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Translation submitted successfully! It will be reviewed shortly.",
      })

      // Reset form and load new sentence
      setTranslation("")
      setCurrentSentence(null)
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "news":
        return "bg-blue-100 text-blue-800"
      case "literature":
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

  const availableLanguages = AFRICAN_LANGUAGES.filter(
    (lang) => userProfile.native_languages?.includes(lang.code) || userProfile.fluent_languages?.includes(lang.code),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Translation Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.user_metadata?.full_name || user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Database Status */}
        <div className="mb-6">
          <DatabaseStatus />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{userStats.total_translations}</div>
              <div className="text-sm text-gray-600">Total Translations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{userStats.pending_reviews}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{userStats.approved_translations}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{userStats.rejected_translations}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Translation Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Translate English Sentences</CardTitle>
            <CardDescription>
              Select a target language and translate English sentences to help build the African language dataset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language to translate to" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Get New Sentence Button */}
            <div className="flex gap-2">
              <Button onClick={fetchRandomSentence} disabled={!selectedLanguage || isLoading} className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Loading..." : "Get New Sentence"}
              </Button>
            </div>

            {/* Current Sentence */}
            {currentSentence && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <Badge className={getCategoryColor(currentSentence.category)}>{currentSentence.category}</Badge>
                    <Badge className={getDifficultyColor(currentSentence.difficulty_level)}>
                      {currentSentence.difficulty_level}
                    </Badge>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{currentSentence.text_content}</p>
                </div>

                {/* Translation Input */}
                <div className="space-y-2">
                  <Label htmlFor="translation">
                    Your Translation ({AFRICAN_LANGUAGES.find((l) => l.code === selectedLanguage)?.name})
                  </Label>
                  <Textarea
                    id="translation"
                    placeholder="Enter your translation here..."
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button onClick={submitTranslation} disabled={!translation.trim() || isSubmitting} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Translation"}
                </Button>
              </div>
            )}

            {!currentSentence && selectedLanguage && (
              <div className="text-center py-8 text-gray-500">Click "Get New Sentence" to start translating</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
