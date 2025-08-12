"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Languages, FileText, CheckCircle, Clock, XCircle, BarChart3, Globe, MessageSquare } from "lucide-react"

const DEMO_DATA = {
  users: [
    { id: 1, name: "John Kamau", role: "Translator", languages: ["Kikuyu", "Swahili"], translations: 45, approved: 42 },
    { id: 2, name: "Mary Achieng", role: "Translator", languages: ["Luo", "Swahili"], translations: 38, approved: 35 },
    {
      id: 3,
      name: "David Kiprop",
      role: "Translator",
      languages: ["Kalenjin", "Swahili"],
      translations: 52,
      approved: 48,
    },
    {
      id: 4,
      name: "Sarah Hassan",
      role: "Translator",
      languages: ["Somali", "Swahili"],
      translations: 29,
      approved: 27,
    },
  ],
  sentences: [
    { id: 1, text: "The sun is shining brightly today.", category: "general", difficulty: "easy", translations: 8 },
    {
      id: 2,
      text: "Climate change affects agricultural productivity.",
      category: "news",
      difficulty: "medium",
      translations: 6,
    },
    {
      id: 3,
      text: "The implementation of blockchain technology requires sophisticated protocols.",
      category: "technical",
      difficulty: "hard",
      translations: 3,
    },
    {
      id: 4,
      text: "Her words carried the weight of generations.",
      category: "literature",
      difficulty: "medium",
      translations: 5,
    },
  ],
  translations: [
    {
      id: 1,
      english: "Hello, how are you?",
      swahili: "Hujambo, habari yako?",
      luo: "Nadi, idhi nade?",
      status: "approved",
    },
    { id: 2, english: "The water is cold.", swahili: "Maji ni baridi.", kikuyu: "Mai ni maruru.", status: "pending" },
    {
      id: 3,
      english: "I love my family.",
      swahili: "Napenda familia yangu.",
      kalenjin: "Achame kororet ne.",
      status: "approved",
    },
    {
      id: 4,
      english: "The book is on the table.",
      swahili: "Kitabu kiko mezani.",
      somali: "Buuggu wuxuu saaran yahay miiska.",
      status: "rejected",
    },
  ],
  stats: {
    totalUsers: 156,
    totalTranslations: 2847,
    approvedTranslations: 2634,
    pendingReviews: 213,
    languages: 10,
    sentences: 100,
  },
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-3 h-3" />
      case "pending":
        return <Clock className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">African Language Data Collection Platform</h1>
          <p className="text-gray-600">Demo Dashboard - System Overview and Sample Data</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.totalUsers}</div>
                  <div className="text-xs text-gray-600">Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.languages}</div>
                  <div className="text-xs text-gray-600">Languages</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.sentences}</div>
                  <div className="text-xs text-gray-600">Sentences</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.totalTranslations}</div>
                  <div className="text-xs text-gray-600">Translations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.approvedTranslations}</div>
                  <div className="text-xs text-gray-600">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{DEMO_DATA.stats.pendingReviews}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sentences">Sentences</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Translation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Approved Translations</span>
                        <span>
                          {Math.round((DEMO_DATA.stats.approvedTranslations / DEMO_DATA.stats.totalTranslations) * 100)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(DEMO_DATA.stats.approvedTranslations / DEMO_DATA.stats.totalTranslations) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pending Reviews</span>
                        <span>
                          {Math.round((DEMO_DATA.stats.pendingReviews / DEMO_DATA.stats.totalTranslations) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${(DEMO_DATA.stats.pendingReviews / DEMO_DATA.stats.totalTranslations) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Language Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {["Swahili", "Luo", "Kikuyu", "Kalenjin", "Somali", "Luhya", "Kamba", "Meru"].map((lang) => (
                      <div key={lang} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{lang}</span>
                        <Badge variant="outline">{Math.floor(Math.random() * 50) + 20}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Translators</CardTitle>
                <CardDescription>Users currently contributing to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_DATA.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <div className="flex gap-1 mt-1">
                          {user.languages.map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {user.approved}/{user.translations} approved
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((user.approved / user.translations) * 100)}% success rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sentences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>English Sentences</CardTitle>
                <CardDescription>Source sentences available for translation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_DATA.sentences.map((sentence) => (
                    <div key={sentence.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm flex-1 mr-4">{sentence.text}</p>
                        <div className="flex gap-1">
                          <Badge className="text-xs">{sentence.category}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {sentence.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{sentence.translations} translations completed</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Translations</CardTitle>
                <CardDescription>Latest translation submissions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_DATA.translations.map((translation) => (
                    <div key={translation.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">English:</span>
                        <Badge className={getStatusColor(translation.status)}>
                          {getStatusIcon(translation.status)}
                          <span className="ml-1">{translation.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{translation.english}</p>

                      {translation.swahili && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-blue-600">Swahili:</span>
                          <span className="text-sm ml-2">{translation.swahili}</span>
                        </div>
                      )}

                      {translation.luo && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-green-600">Luo:</span>
                          <span className="text-sm ml-2">{translation.luo}</span>
                        </div>
                      )}

                      {translation.kikuyu && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-purple-600">Kikuyu:</span>
                          <span className="text-sm ml-2">{translation.kikuyu}</span>
                        </div>
                      )}

                      {translation.kalenjin && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-orange-600">Kalenjin:</span>
                          <span className="text-sm ml-2">{translation.kalenjin}</span>
                        </div>
                      )}

                      {translation.somali && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-red-600">Somali:</span>
                          <span className="text-sm ml-2">{translation.somali}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
            onClick={() => (window.location.href = "/")}
          >
            <Users className="w-6 h-6" />
            <span>Login System</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
            onClick={() => (window.location.href = "/translate")}
          >
            <Languages className="w-6 h-6" />
            <span>Translation Interface</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
            onClick={() => (window.location.href = "/test")}
          >
            <BarChart3 className="w-6 h-6" />
            <span>System Tests</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
            onClick={() => (window.location.href = "/api/test-db")}
          >
            <CheckCircle className="w-6 h-6" />
            <span>API Status</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
