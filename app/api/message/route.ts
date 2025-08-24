export const runtime = "edge"

import { getLatestLocation } from "@/lib/shared-state"

export async function GET() {
  try {
    const location = await getLatestLocation()

    if (!location) {
      return new Response(
        JSON.stringify({
          message: null,
          train: null,
          color: null,
          error: "No messages found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Return the raw text that was sent
    const messageText = location.message || location.city || null

    // Return simple train field
    const trainField = location.train_info || null

    // Return train color
    const colorField = location.train_color || null

    return new Response(
      JSON.stringify({
        message: messageText,
        train: trainField,
        color: colorField,
        timestamp: location.created_at,
        hasCountdown: location.has_countdown,
        targetTime: location.target_time,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error retrieving message:", error)

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
