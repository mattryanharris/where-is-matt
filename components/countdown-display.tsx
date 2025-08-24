"use client"

import { useState, useEffect } from "react"
import { formatTimeRemaining } from "@/lib/time-parser"

interface CountdownDisplayProps {
  targetTime: string
  message: string
}

export function CountdownDisplay({ targetTime, message }: CountdownDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    console.log(`CountdownDisplay mounted with targetTime: ${targetTime}`)

    const updateCountdown = () => {
      const target = new Date(targetTime)
      const now = new Date()
      const remaining = formatTimeRemaining(target)

      console.log(
        `Countdown update - Target: ${target.toISOString()}, Now: ${now.toISOString()}, Remaining: ${remaining}`,
      )

      setTimeRemaining(remaining)
      setIsExpired(remaining === "Arrived!")
      setDebugInfo(`Target: ${target.toLocaleTimeString()}, Now: ${now.toLocaleTimeString()}`)
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetTime])

  return (
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-800 mb-2">{message}</div>
      <div className={`text-4xl font-bold ${isExpired ? "text-green-600" : "text-indigo-600"}`}>
        {timeRemaining || "Loading..."}
      </div>
      {!isExpired && <div className="text-sm text-gray-500 mt-2">Updates automatically</div>}

      {/* Debug info - remove this in production */}
      <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
        <div>Target Time: {targetTime}</div>
        <div>{debugInfo}</div>
      </div>
    </div>
  )
}
