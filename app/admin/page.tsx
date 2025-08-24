"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Monitor, Clock, Play, ImageIcon, Settings, Zap, Code } from "lucide-react"

export default function AdminPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [isFullCronRunning, setIsFullCronRunning] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  const triggerPrepare = async () => {
    setIsPreparing(true)
    setError(null)

    try {
      const response = await fetch("/api/prepare-tidbyt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLastResult({
          ...result,
          message: "Tidbyt prepared successfully (no push yet)",
          triggeredBy: "prepare-only",
        })
        setError(null)
      } else {
        setError(result.error || "Preparation failed")
        setLastResult(null)
      }
    } catch (err) {
      setError("Network error during preparation")
      setLastResult(null)
    } finally {
      setIsPreparing(false)
    }
  }

  const triggerFullCron = async () => {
    setIsFullCronRunning(true)
    setError(null)

    try {
      const response = await fetch("/api/cron-full", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLastResult({
          ...result,
          message: "Full workflow completed successfully",
          triggeredBy: "full-cron-manual",
        })
        setError(null)
      } else {
        setError(result.error || "Full workflow failed")
        setLastResult(null)
      }
    } catch (err) {
      setError("Network error during full workflow")
      setLastResult(null)
    } finally {
      setIsFullCronRunning(false)
    }
  }

  const triggerUpdate = async () => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch("/api/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLastResult(result)
        setError(null)
      } else {
        setError(result.error || "Update failed")
        setLastResult(null)
      }
    } catch (err) {
      setError("Network error - could not trigger update")
      setLastResult(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTestingPixlet, setIsTestingPixlet] = useState(false)
  const [isCheckingFiles, setIsCheckingFiles] = useState(false)
  const [isSendingWebp, setIsSendingWebp] = useState(false)
  const [isTestingAutoTrigger, setIsTestingAutoTrigger] = useState(false)
  const [isCheckingStar, setIsCheckingStar] = useState(false)

  const checkStarFile = async () => {
    setIsCheckingStar(true)
    try {
      const response = await fetch("/api/debug-star")
      const result = await response.json()
      setDebugInfo(result)
    } catch (err) {
      setDebugInfo({ error: "Failed to check star file" })
    } finally {
      setIsCheckingStar(false)
    }
  }

  const checkFiles = async () => {
    setIsCheckingFiles(true)
    try {
      const response = await fetch("/api/debug-files")
      const result = await response.json()
      setDebugInfo(result)
    } catch (err) {
      setDebugInfo({ error: "Failed to check files" })
    } finally {
      setIsCheckingFiles(false)
    }
  }

  const runDebug = async () => {
    setIsDebugging(true)
    try {
      const response = await fetch("/api/test-image")
      const result = await response.json()
      setDebugInfo(result)
    } catch (err) {
      setDebugInfo({ error: "Failed to run debug" })
    } finally {
      setIsDebugging(false)
    }
  }

  const forceGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-image", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setLastResult({
          ...result,
          message: "Image generated successfully",
          triggeredBy: "force-generate",
        })
        setError(null)
      } else {
        setError("Image generation failed: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      setError("Network error during image generation")
    } finally {
      setIsGenerating(false)
    }
  }

  const testPixlet = async () => {
    setIsTestingPixlet(true)
    setError(null)

    try {
      const response = await fetch("/api/test-pixlet", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setLastResult({
          ...result,
          message: "Pixlet test successful",
          triggeredBy: "pixlet-test",
        })
        setError(null)
      } else {
        setError("Pixlet test failed: " + (result.error || "Unknown error"))
        setDebugInfo(result) // Show the debug info
      }
    } catch (err) {
      setError("Network error during pixlet test")
    } finally {
      setIsTestingPixlet(false)
    }
  }

  const sendWebp = async () => {
    setIsSendingWebp(true)
    setError(null)

    try {
      const response = await fetch("/api/send-webp", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setLastResult({
          ...result,
          message: `Successfully sent ${result.fileSent} to Tidbyt`,
          triggeredBy: "send-webp",
        })
        setError(null)
      } else {
        setError("Send webp failed: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      setError("Network error during webp send")
    } finally {
      setIsSendingWebp(false)
    }
  }

  const testAutoTrigger = async () => {
    setIsTestingAutoTrigger(true)
    setError(null)

    try {
      const response = await fetch("/api/test-auto-trigger", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setLastResult({
          ...result,
          message: "Auto-trigger test successful - Tidbyt should have updated",
          triggeredBy: "auto-trigger-test",
        })
        setError(null)
      } else {
        setError("Auto-trigger test failed: " + (result.error || "Unknown error"))
        setDebugInfo(result) // Show the debug info
      }
    } catch (err) {
      setError("Network error during auto-trigger test")
    } finally {
      setIsTestingAutoTrigger(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tidbyt Admin</h1>
          <p className="text-gray-600">Manage your "Where is Matt" display</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Manual Update
              </CardTitle>
              <CardDescription>Trigger an immediate update to your Tidbyt display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={triggerUpdate} disabled={isUpdating} className="w-full" size="lg">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Display...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Update Tidbyt Now
                  </>
                )}
              </Button>

              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  ✅ Automatic cron job uses the same process as this button
                </Badge>
              </div>

              <Button
                onClick={triggerFullCron}
                disabled={isFullCronRunning}
                className="w-full mb-4 bg-transparent"
                size="lg"
                variant="outline"
              >
                {isFullCronRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Full Workflow...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Alternative: Prepare → Generate → Send
                  </>
                )}
              </Button>

              <Button
                onClick={triggerPrepare}
                disabled={isPreparing}
                className="w-full mb-4 bg-transparent"
                size="lg"
                variant="outline"
              >
                {isPreparing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Step 1: Prepare Only (No Push)
                  </>
                )}
              </Button>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <Button onClick={checkStarFile} disabled={isCheckingStar} variant="outline" size="sm">
                  {isCheckingStar ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Code className="mr-1 h-3 w-3" />
                      Star File
                    </>
                  )}
                </Button>

                <Button onClick={runDebug} disabled={isDebugging} variant="outline" size="sm">
                  {isDebugging ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Debug...
                    </>
                  ) : (
                    "Debug"
                  )}
                </Button>

                <Button onClick={checkFiles} disabled={isCheckingFiles} variant="outline" size="sm">
                  {isCheckingFiles ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Files...
                    </>
                  ) : (
                    "Files"
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={testAutoTrigger} disabled={isTestingAutoTrigger} variant="outline" size="sm">
                  {isTestingAutoTrigger ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Auto-Trigger"
                  )}
                </Button>

                <Button onClick={testPixlet} disabled={isTestingPixlet} variant="outline" size="sm">
                  {isTestingPixlet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Pixlet"
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={forceGenerate} disabled={isGenerating} variant="outline" size="sm">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Force Generate"
                  )}
                </Button>

                <Button onClick={sendWebp} disabled={isSendingWebp} variant="outline" size="sm">
                  {isSendingWebp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send WebP"
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {lastResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-800 font-medium">Success!</p>
                    <Badge variant="secondary">{new Date(lastResult.timestamp).toLocaleTimeString()}</Badge>
                  </div>
                  <p className="text-green-600 text-sm">{lastResult.message}</p>
                  {lastResult.triggeredBy && (
                    <p className="text-green-500 text-xs mt-1">Triggered: {lastResult.triggeredBy}</p>
                  )}
                  {lastResult.note && <p className="text-blue-600 text-xs mt-1">Note: {lastResult.note}</p>}
                  {lastResult.imageUrl && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href={lastResult.imageUrl} target="_blank" rel="noopener noreferrer">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          View Generated Image
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {debugInfo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-blue-800 font-medium mb-2">Debug Information:</p>

                  {/* Show star file content if available */}
                  {debugInfo.starFile?.content && (
                    <div className="mb-4">
                      <p className="text-blue-700 font-medium text-sm mb-1">Generated Star File:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {debugInfo.starFile.content}
                      </pre>
                    </div>
                  )}

                  {/* Show message data if available */}
                  {debugInfo.message && (
                    <div className="mb-4">
                      <p className="text-blue-700 font-medium text-sm mb-1">Current Message Data:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(debugInfo.message, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Show debug steps */}
                  <div className="text-xs text-blue-600 space-y-1">
                    {debugInfo.steps?.map((step: string, i: number) => (
                      <div key={i}>{step}</div>
                    ))}
                    {debugInfo.errors?.length > 0 && (
                      <div className="text-red-600 mt-2">
                        <strong>Errors:</strong>
                        {debugInfo.errors.map((error: string, i: number) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Current Display
              </CardTitle>
              <CardDescription>Preview what's currently on your Tidbyt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-black rounded-lg p-4 flex items-center justify-center min-h-[120px]">
                  <img
                    src="/api/tidbyt-image"
                    alt="Current Tidbyt Display"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<p class="text-gray-400 text-sm">No image available yet</p>'
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <a href="/api/tidbyt-image" target="_blank" rel="noopener noreferrer">
                      View Full Size
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="flex-1">
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Update Triggers
            </CardTitle>
            <CardDescription>Your Tidbyt updates automatically in multiple ways</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  INSTANT
                </Badge>
                <span>
                  <strong>Status Updates:</strong> Tidbyt updates immediately when new location/message is received
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  SCHEDULED
                </Badge>
                <span>
                  <strong>Cron Job:</strong> Every 5 minutes during business hours (Mon-Fri, 8AM-7PM PST)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Play className="h-3 w-3 mr-1" />
                  MANUAL
                </Badge>
                <span>
                  <strong>Admin Button:</strong> "Update Tidbyt Now" button above
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                All three methods use the same reliable update process. Your Tidbyt will always show the latest status!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 mb-4">Check what's currently displayed:</p>
              <Button variant="outline" asChild>
                <a href="/api/message/text" target="_blank" rel="noopener noreferrer">
                  View Current Message
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
