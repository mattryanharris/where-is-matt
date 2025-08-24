"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Clock } from "lucide-react"

interface StatusData {
  id: number
  city?: string
  message?: string
  has_countdown: boolean
  target_time?: string
  created_at: string
}

interface StatusPopupProps {
  onClose: () => void
  statusData: StatusData
  autoUpdateStatus?: {
    success: boolean
    error?: string
  }
}

export function StatusPopup({ onClose, statusData, autoUpdateStatus }: StatusPopupProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {statusData.has_countdown ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <MapPin className="h-5 w-5 text-green-500" />
            )}
            <h3 className="font-semibold text-gray-800">Status Updated!</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-gray-700 font-medium">{statusData.message || statusData.city}</p>

          {statusData.has_countdown && statusData.target_time && (
            <p className="text-sm text-blue-600">Countdown active until {formatTime(statusData.target_time)}</p>
          )}

          <p className="text-xs text-gray-500">Updated at {formatTime(statusData.created_at)}</p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          {autoUpdateStatus ? (
            autoUpdateStatus.success ? (
              <p className="text-xs text-green-600">✅ Tidbyt display updated successfully</p>
            ) : (
              <p className="text-xs text-red-600">❌ Tidbyt update failed: {autoUpdateStatus.error}</p>
            )
          ) : (
            <p className="text-xs text-gray-400">Tidbyt update status unknown</p>
          )}
        </div>
      </div>
    </div>
  )
}
