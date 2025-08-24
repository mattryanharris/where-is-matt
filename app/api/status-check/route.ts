export const runtime = "edge"

import { getLatestLocation } from "@/lib/shared-state"

export async function GET() {
  try {
    const location = await getLatestLocation()

    if (!location) {
      return new Response(
        JSON.stringify({
          hasData: false,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      )
    }

    return new Response(
      JSON.stringify({
        hasData: true,
        id: location.id,
        message: location.message || location.city,
        hasCountdown: location.has_countdown,
        targetTime: location.target_time,
        timestamp: location.created_at,
        lastCheck: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("Error in status check:", error)

    return new Response(
      JSON.stringify({
        hasData: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  }
}
