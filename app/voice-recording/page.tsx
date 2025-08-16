"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Mic, Square, Play, Pause, RotateCcw, Send, ArrowLeft } from "lucide-react"

interface Sentence {
  id: string
  text: string
  language: string
  category: string
  difficulty_level: string
}

export default function VoiceRecordingPage() {
  const [user, setUser] = useState<any>(null)
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
      }
    }
    getUser()
  }, [router, supabase])

  const fetchRandomSentence = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/random-sentence?language=english")
      if (!response.ok) throw new Error("Failed to fetch sentence")

      const data = await response.json()
      if (data.sentence) {
        setCurrentSentence(data.sentence)
        // Reset recording state
        setRecordedBlob(null)
        setRecordingDuration(0)
        setIsPlaying(false)
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playRecording = () => {
    if (recordedBlob) {
      const audioUrl = URL.createObjectURL(recordedBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)

      audio.play()
    }
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordingDuration(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const submitRecording = async () => {
    if (!recordedBlob || !currentSentence || !user) return

    setIsSubmitting(true)
    try {
      // Upload audio file to Supabase Storage
      const fileName = `recording_${user.id}_${Date.now()}.wav`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(fileName, recordedBlob)

      if (uploadError) throw uploadError

      // Save recording metadata to database
      const { error: dbError } = await supabase.from("voice_recordings").insert({
        user_id: user.id,
        sentence_id: currentSentence.id,
        audio_file_path: uploadData.path,
        duration_seconds: recordingDuration,
        status: "pending",
        language: currentSentence.language,
        category: currentSentence.category,
      })

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Voice recording submitted successfully! It will be reviewed shortly.",
      })

      // Reset and get new sentence
      resetRecording()
      setCurrentSentence(null)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/settings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice Recording</h1>
              <p className="text-gray-600">Record your voice reading the sentences</p>
            </div>
          </div>
        </div>

        {/* Get New Sentence */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Button onClick={fetchRandomSentence} disabled={isLoading} className="w-full">
              {isLoading ? "Loading..." : "Get New Sentence to Record"}
            </Button>
          </CardContent>
        </Card>

        {/* Current Sentence */}
        {currentSentence && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Read This Sentence</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{currentSentence.category}</Badge>
                <Badge variant="outline">{currentSentence.difficulty_level}</Badge>
                <Badge variant="outline">{currentSentence.language}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-lg font-medium text-gray-900">{currentSentence.text}</p>
              </div>

              {/* Recording Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {!isRecording && !recordedBlob && (
                    <Button onClick={startRecording} size="lg" className="bg-red-600 hover:bg-red-700">
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  )}

                  {isRecording && (
                    <Button onClick={stopRecording} size="lg" variant="destructive">
                      <Square className="w-5 h-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  {recordedBlob && !isRecording && (
                    <div className="flex gap-2">
                      <Button onClick={isPlaying ? pausePlayback : playRecording} variant="outline">
                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isPlaying ? "Pause" : "Play"}
                      </Button>
                      <Button onClick={resetRecording} variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Re-record
                      </Button>
                      <Button onClick={submitRecording} disabled={isSubmitting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Submitting..." : "Submit Recording"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Recording Status */}
                <div className="text-center">
                  {isRecording && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600 font-medium">Recording: {formatTime(recordingDuration)}</span>
                    </div>
                  )}

                  {recordedBlob && !isRecording && (
                    <div className="text-green-600 font-medium">
                      Recording completed: {formatTime(recordingDuration)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!currentSentence && (
          <Card>
            <CardContent className="p-8 text-center">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Ready to Record</h3>
              <p className="text-gray-600">Click "Get New Sentence" to start recording your voice</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
