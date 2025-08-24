export const runtime = "edge"

import { getLocationHistory } from "@/lib/shared-state"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 10

    const history = await getLocationHistory(limit)

    const messages = history.map((record) => ({
      id: record.id,
      message: record.message || record.city,
      timestamp: record.created_at,
      hasCountdown: record.has_countdown,
      targetTime: record.target_time,
      coordinates:
        record.latitude && record.longitude
          ? {
              lat: record.latitude,
              lon: record.longitude,
            }
          : null,
    }))

    return new Response(
      JSON.stringify(
        {
          messages,
          count: messages.length,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error retrieving message history:", error)

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
