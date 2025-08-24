"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, SkipForward, AlertTriangle, CheckCircle } from "lucide-react"
import Image from "next/image"

interface Recording {
  id: string
  audio_url: string
  description_text: string
  duration: number
  created_at: string
  user_profiles: {
    full_name: string
    native_language: string
    dialect: string
  }
  image_prompts: {
    id: string
    image_url: string
    category: string
    description_sw: string
    description_en: string
    description_ka: string
  }
}

const rejectionReasons = [
  { id: "poor_quality", label: "Poor audio quality" },
  { id: "background_noise", label: "Background noise/interference" },
  { id: "incorrect_content", label: "Incorrect content (doesn't match image)" },
  { id: "technical_issues", label: "Technical issues (distortion, clipping)" },
  { id: "language_issues", label: "Language/pronunciation issues" },
  { id: "volume_issues", label: "Too quiet/too loud" },
  { id: "repetition", label: "Repeated sentences or content" },
  { id: "started_incorrectly", label: 'Started with "in this picture" or similar' },
  { id: "other", label: "Other" },
]

export default function ValidateAudioPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(true)
  const [validationStats, setValidationStats] = useState({ total: 0, approved: 0, rejected: 0 })

  const supabase = createClient()

  useEffect(() => {
    fetchPendingRecordings()
    fetchValidationStats()
  }, [])

  const fetchPendingRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from("voice_recordings")
        .select(`
          *,
          user_profiles (full_name, native_language, dialect),
          image_prompts (id, image_url, category, description_sw, description_en, description_ka)
        `)
        .eq("validation_status", "pending")
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error
      setRecordings(data || [])
    } catch (error) {
      console.error("Error fetching recordings:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchValidationStats = async () => {
    try {
      const { data, error } = await supabase.from("voice_recordings").select("validation_status")

      if (error) throw error

      const stats = data?.reduce(
        (acc, record) => {
          acc.total++
          if (record.validation_status === "approved") acc.approved++
          if (record.validation_status === "rejected") acc.rejected++
          return acc
        },
        { total: 0, approved: 0, rejected: 0 },
      ) || { total: 0, approved: 0, rejected: 0 }

      setValidationStats(stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const playAudio = () => {
    if (!recordings[currentIndex]) return

    if (audio) {
      audio.pause()
    }

    const newAudio = new Audio(recordings[currentIndex].audio_url)
    newAudio.onplay = () => setIsPlaying(true)
    newAudio.onpause = () => setIsPlaying(false)
    newAudio.onended = () => setIsPlaying(false)

    setAudio(newAudio)
    newAudio.play()
  }

  const pauseAudio = () => {
    if (audio) {
      audio.pause()
    }
  }

  const approveRecording = async () => {
    if (!recordings[currentIndex]) return

    try {
      const { error } = await supabase
        .from("voice_recordings")
        .update({
          validation_status: "approved",
          validated_at: new Date().toISOString(),
        })
        .eq("id", recordings[currentIndex].id)

      if (error) throw error

      // Create validation feedback
      await supabase.from("validation_feedback").insert({
        recording_id: recordings[currentIndex].id,
        feedback_type: "approved",
      })

      nextRecording()
      fetchValidationStats()
    } catch (error) {
      console.error("Error approving recording:", error)
    }
  }

  const rejectRecording = async () => {
    if (!recordings[currentIndex] || selectedReasons.length === 0) return

    try {
      const { error } = await supabase
        .from("voice_recordings")
        .update({
          validation_status: "rejected",
          rejection_reasons: selectedReasons,
          validator_feedback: feedback,
          validated_at: new Date().toISOString(),
        })
        .eq("id", recordings[currentIndex].id)

      if (error) throw error

      // Create validation feedback
      await supabase.from("validation_feedback").insert({
        recording_id: recordings[currentIndex].id,
        feedback_type: "rejected",
        rejection_reasons: selectedReasons,
        feedback_text: feedback,
      })

      setShowRejectionModal(false)
      setSelectedReasons([])
      setFeedback("")
      nextRecording()
      fetchValidationStats()
    } catch (error) {
      console.error("Error rejecting recording:", error)
    }
  }

  const nextRecording = () => {
    if (audio) {
      audio.pause()
    }
    setCurrentIndex((prev) => prev + 1)
  }

  const skipRecording = () => {
    nextRecording()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recordings...</p>
        </div>
      </div>
    )
  }

  if (currentIndex >= recordings.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">All Done!</h2>
            <p className="text-gray-600 mb-4">You've reviewed all pending recordings.</p>
            <Button onClick={() => window.location.reload()}>Check for New Recordings</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRecording = recordings[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Validate Audio</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                {validationStats.approved} Approved
              </Badge>
              <Badge variant="outline" className="text-red-600">
                {validationStats.rejected} Rejected
              </Badge>
              <Badge variant="outline">{validationStats.total} Total</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Image Prompt</span>
                <Badge>{currentRecording.image_prompts?.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square mb-4">
                <Image
                  src={currentRecording.image_prompts?.image_url || "/placeholder.svg?height=400&width=400"}
                  alt="Prompt image"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Instructions</h4>
                  <p className="text-sm text-green-700">{currentRecording.image_prompts?.description_sw}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Validation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Audio Recording</CardTitle>
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Speaker:</strong> {currentRecording.user_profiles?.full_name}
                </p>
                <p>
                  <strong>Language:</strong> {currentRecording.user_profiles?.native_language} (
                  {currentRecording.user_profiles?.dialect})
                </p>
                <p>
                  <strong>Duration:</strong> {Math.round(currentRecording.duration)}s
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Controls */}
              <div className="flex items-center space-x-4">
                <Button onClick={isPlaying ? pauseAudio : playAudio} variant="outline" size="lg">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={skipRecording} variant="ghost">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              </div>

              {/* User's Description */}
              {currentRecording.description_text && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-1">User's Description:</h4>
                  <p className="text-sm">{currentRecording.description_text}</p>
                </div>
              )}

              {/* Validation Actions */}
              <div className="flex space-x-3">
                <Button onClick={approveRecording} className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={() => setShowRejectionModal(true)} variant="destructive" className="flex-1">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>

              {/* Progress */}
              <div className="text-center text-sm text-gray-500">
                Recording {currentIndex + 1} of {recordings.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Rejection Feedback - Audio Validation</CardTitle>
                <p className="text-sm text-gray-600">Please select the reason(s) for rejection:</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {rejectionReasons.map((reason) => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={reason.id}
                        checked={selectedReasons.includes(reason.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReasons([...selectedReasons, reason.id])
                          } else {
                            setSelectedReasons(selectedReasons.filter((r) => r !== reason.id))
                          }
                        }}
                      />
                      <label htmlFor={reason.id} className="text-sm">
                        {reason.label}
                      </label>
                    </div>
                  ))}
                </div>

                <Textarea
                  placeholder="Additional feedback (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />

                <p className="text-xs text-gray-500">
                  This feedback will be sent to the original contributor to help them improve future submissions.
                </p>

                <div className="flex space-x-3">
                  <Button onClick={() => setShowRejectionModal(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={rejectRecording}
                    variant="destructive"
                    className="flex-1"
                    disabled={selectedReasons.length === 0}
                  >
                    Submit Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
