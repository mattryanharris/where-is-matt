"use client"

import { useState, useEffect } from "react"
import { CountdownDisplay } from "@/components/countdown-display"
import { StatusPopup } from "@/components/status-popup"

interface LocationData {
  id: number
  city?: string
  message?: string
  has_countdown: boolean
  target_time?: string
  created_at: string
}

export default function HomePage() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [lastSeenId, setLastSeenId] = useState<number | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  const fetchLocationData = async (showNotification = false) => {
    try {
      const response = await fetch("/api/status-check", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (data.hasData) {
          const locationData = {
            id: data.id,
            city: data.hasCountdown ? undefined : data.message,
            message: data.hasCountdown ? data.message : undefined,
            has_countdown: data.hasCountdown || false,
            target_time: data.targetTime,
            created_at: data.timestamp,
          }

          // Check if this is new data
          if (showNotification && lastSeenId && locationData.id !== lastSeenId) {
            setShowPopup(true)
            console.log("🔔 New status detected, showing popup")
          }

          setLocation(locationData)
          setLastSeenId(locationData.id)
          setError(null)
        } else {
          setLocation(null)
        }
      } else {
        console.error("Failed to fetch location data")
      }
    } catch (err: any) {
      console.error("Error fetching location data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchLocationData(false)
  }, [])

  // Polling for updates
  useEffect(() => {
    if (!isPolling) return

    const interval = setInterval(() => {
      fetchLocationData(true)
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [isPolling, lastSeenId])

  // Pause polling when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPolling(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📍 Current Status</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium mb-2">Error</div>
            <div className="text-red-600 text-sm">Unable to load location data</div>
            <div className="text-red-500 text-xs mt-2">Check your connection or try refreshing the page</div>
          </div>
        )}

        {!error && !location && (
          <div>
            <div className="text-4xl font-semibold text-gray-400 mb-4">No updates yet</div>
            <p className="text-gray-500 text-sm">Send a POST request to /api/location</p>
          </div>
        )}

        {!error && location && location.has_countdown && location.target_time && (
          <CountdownDisplay targetTime={location.target_time} message={location.message || "Countdown"} />
        )}

        {!error && location && !location.has_countdown && (
          <div>
            <div className="text-4xl font-semibold text-indigo-600 mb-4">{location.city || location.message}</div>
            <p className="text-gray-600 text-sm">Latest update</p>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isPolling ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}></div>
          <span>{isPolling ? "Live updates active" : "Updates paused"}</span>
        </div>

        {/* Last updated time */}
        {location && (
          <div className="mt-2 text-xs text-gray-400">
            Last updated: {new Date(location.created_at).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Status change popup */}
      {showPopup && location && <StatusPopup statusData={location} onClose={handleClosePopup} />}
    </div>
  )
}
