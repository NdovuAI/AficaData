"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { LogOut, Mic, Clock, CheckCircle, XCircle, Loader } from "lucide-react"

const AFRICAN_LANGUAGES = [
  { id: "kikuyu", name: "Kikuyu", code: "kik" },
  { id: "kalenjin", name: "Kalenjin", code: "kal" },
  { id: "somali", name: "Somali", code: "som" },
  { id: "dholuo", name: "Dholuo", code: "luo" },
  { id: "maasai", name: "Maasai", code: "mas" },
  { id: "kiswahili", name: "Kiswahili", code: "sw" },
]

interface RecordingStats {
  total_recordings: number
  total_duration_hours: number
  accepted_recordings: number
  accepted_duration_hours: number
  pending_recordings: number
  pending_duration_hours: number
  rejected_recordings: number
  rejected_duration_hours: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [recordingStats, setRecordingStats] = useState<RecordingStats>({
    total_recordings: 0,
    total_duration_hours: 0,
    accepted_recordings: 0,
    accepted_duration_hours: 0,
    pending_recordings: 0,
    pending_duration_hours: 0,
    rejected_recordings: 0,
    rejected_duration_hours: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

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
        await loadUserProfile(user.id)
        await loadRecordingStats(user.id)
      }
    }
    getUser()
  }, [router, supabase])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

      if (profile) {
        setUserProfile(profile)
        // Set default language from user's native languages
        if (profile.native_languages && profile.native_languages.length > 0) {
          const nativeLanguage = AFRICAN_LANGUAGES.find((lang) => profile.native_languages.includes(lang.code))
          if (nativeLanguage) {
            setSelectedLanguage(nativeLanguage.id)
          }
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRecordingStats = async (userId: string) => {
    try {
      const { data: recordings } = await supabase.from("voice_recordings").select("*").eq("user_id", userId)

      if (recordings) {
        const stats = recordings.reduce(
          (acc, recording) => {
            const durationHours = (recording.duration_seconds || 0) / 3600

            acc.total_recordings += 1
            acc.total_duration_hours += durationHours

            switch (recording.status) {
              case "accepted":
                acc.accepted_recordings += 1
                acc.accepted_duration_hours += durationHours
                break
              case "pending":
                acc.pending_recordings += 1
                acc.pending_duration_hours += durationHours
                break
              case "rejected":
                acc.rejected_recordings += 1
                acc.rejected_duration_hours += durationHours
                break
            }

            return acc
          },
          {
            total_recordings: 0,
            total_duration_hours: 0,
            accepted_recordings: 0,
            accepted_duration_hours: 0,
            pending_recordings: 0,
            pending_duration_hours: 0,
            rejected_recordings: 0,
            rejected_duration_hours: 0,
          },
        )

        setRecordingStats(stats)
      }
    } catch (error) {
      console.error("Error loading recording stats:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const StatCard = ({ title, recordings, duration, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold">{recordings}</p>
                <p className="text-xs text-gray-500">Recordings</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{duration.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Hours</p>
              </div>
            </div>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Collection Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/translate")}>
              Translation Practice
            </Button>
            <Button variant="outline" onClick={() => router.push("/voice-recording")}>
              <Mic className="w-4 h-4 mr-2" />
              Record Voice
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Language Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Language Selection</CardTitle>
            <CardDescription>Select your preferred language for voice recording</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AFRICAN_LANGUAGES.map((language) => (
                <Button
                  key={language.id}
                  variant={selectedLanguage === language.id ? "default" : "outline"}
                  onClick={() => setSelectedLanguage(language.id)}
                  className="mb-2"
                >
                  {language.name}
                </Button>
              ))}
            </div>
            {selectedLanguage && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected Language: <strong>{AFRICAN_LANGUAGES.find((l) => l.id === selectedLanguage)?.name}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recording Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="TOTAL RECORDINGS"
            recordings={recordingStats.total_recordings}
            duration={recordingStats.total_duration_hours}
            icon={Mic}
            color="text-blue-600"
          />
          <StatCard
            title="ACCEPTED"
            recordings={recordingStats.accepted_recordings}
            duration={recordingStats.accepted_duration_hours}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            title="PENDING"
            recordings={recordingStats.pending_recordings}
            duration={recordingStats.pending_duration_hours}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="REJECTED"
            recordings={recordingStats.rejected_recordings}
            duration={recordingStats.rejected_duration_hours}
            icon={XCircle}
            color="text-red-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/voice-recording")}
          >
            <CardContent className="p-6 text-center">
              <Mic className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Start Recording</h3>
              <p className="text-sm text-gray-600">Record new voice samples</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/recordings")}>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="font-semibold mb-2">Pending Recordings</h3>
              <p className="text-sm text-gray-600">View recordings under review</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/translate")}>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">Translation Practice</h3>
              <p className="text-sm text-gray-600">Practice text translations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
