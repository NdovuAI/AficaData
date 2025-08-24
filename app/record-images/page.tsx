"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Play, Pause, RotateCcw, Send, SkipForward } from "lucide-react"
import Image from "next/image"

interface ImagePrompt {
  id: string
  image_url: string
  category: string
  description_sw: string
  description_en: string
  description_ka: string
}

export default function RecordImagesPage() {
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchImagePrompts()
    fetchUserProfile()
  }, [])

  const fetchImagePrompts = async () => {
    try {
      const { data, error } = await supabase.from("image_prompts").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setImagePrompts(data || [])
    } catch (error) {
      console.error("Error fetching image prompts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Error accessing microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDescription("")
    if (audioRef.current) {
      audioRef.current.src = ""
    }
  }

  const submitRecording = async () => {
    if (!audioBlob || !userProfile || !imagePrompts[currentIndex]) return

    try {
      // Upload audio file
      const fileName = `recording_${Date.now()}.wav`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-recordings").getPublicUrl(fileName)

      // Save recording to database
      const { error: insertError } = await supabase.from("voice_recordings").insert({
        user_id: userProfile.user_id,
        audio_url: publicUrl,
        image_prompt_id: imagePrompts[currentIndex].id,
        description_text: description,
        duration: audioBlob.size / 1000, // Approximate duration
        validation_status: "pending",
      })

      if (insertError) throw insertError

      // Move to next image
      nextImage()
      resetRecording()

      alert("Recording submitted successfully!")
    } catch (error) {
      console.error("Error submitting recording:", error)
      alert("Error submitting recording. Please try again.")
    }
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imagePrompts.length)
    resetRecording()
  }

  const skipImage = () => {
    nextImage()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image prompts...</p>
        </div>
      </div>
    )
  }

  if (imagePrompts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <p className="text-gray-600 mb-4">No image prompts available.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPrompt = imagePrompts[currentIndex]
  const getInstructions = () => {
    if (userProfile?.native_language === "Kiswahili") return currentPrompt.description_sw
    if (userProfile?.native_language === "Kalenjin") return currentPrompt.description_ka
    return currentPrompt.description_en
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Record Images</h1>
            <Badge variant="outline">
              Image {currentIndex + 1} of {imagePrompts.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Describe This Image</span>
                <Badge>{currentPrompt.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square mb-4">
                <Image
                  src={currentPrompt.image_url || "/placeholder.svg"}
                  alt="Image to describe"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Instructions</h4>
                <p className="text-sm text-blue-700">{getInstructions()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recording Section */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Recording</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording Controls */}
              <div className="flex items-center justify-center space-x-4">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="bg-red-600 hover:bg-red-700">
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="animate-pulse">
                    <MicOff className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>

              {/* Audio Playback */}
              {audioUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-3">
                    <Button onClick={isPlaying ? pauseRecording : playRecording} variant="outline">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button onClick={resetRecording} variant="ghost">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Re-record
                    </Button>
                  </div>

                  <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
                </div>
              )}

              {/* Description Text */}
              <div>
                <label className="block text-sm font-medium mb-2">Written Description (Optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="You can also write what you described..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button onClick={submitRecording} disabled={!audioBlob} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Recording
                </Button>
                <Button onClick={skipImage} variant="outline">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              </div>

              {/* Guidelines */}
              <div className="p-3 bg-yellow-50 rounded-lg text-sm">
                <h4 className="font-medium text-yellow-800 mb-1">Remember:</h4>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Don't start with "In this picture" or similar phrases</li>
                  <li>• Avoid repeating the same sentences</li>
                  <li>• Skip if you don't know what to say</li>
                  <li>• Speak clearly and naturally</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
