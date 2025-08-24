export const runtime = "edge"

import { getLatestLocation } from "@/lib/shared-state"

export async function GET() {
  try {
    const location = await getLatestLocation()

    if (!location) {
      return new Response("No message found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    // Return just the raw text
    const messageText = location.message || location.city || "No message"

    return new Response(messageText, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    console.error("Error retrieving message text:", error)

    return new Response("Error retrieving message", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })
  }
}
