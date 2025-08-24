export const runtime = "edge"

import { setLatestCity, setCountdownMessage } from "@/lib/shared-state"
import { parseTimeString } from "@/lib/time-parser"

interface LocationRequest {
  lat?: number
  lon?: number
  city?: string
  message?: string
  train?: string
  color?: string
}

interface OpenCageResponse {
  results: Array<{
    components: {
      city?: string
      town?: string
      village?: string
      municipality?: string
    }
  }>
}

async function triggerTidbytUpdate() {
  try {
    console.log("🚀 Auto-triggering Tidbyt update after status change...")

    // Get the current origin/host for the API call
    const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/cron"

    console.log(`Making request to: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(45000), // 45 second timeout
    })

    console.log(`Tidbyt update response status: ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log("✅ Tidbyt auto-update successful:", result.message)
      return { success: true, message: result.message }
    } else {
      const errorText = await response.text()
      console.error("❌ Tidbyt auto-update failed:", response.status, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
  } catch (error: any) {
    console.error("❌ Tidbyt auto-update error:", error.message)
    return { success: false, error: error.message }
  }
}

export async function POST(request: Request) {
  try {
    const body: LocationRequest = await request.json()

    // Check if coordinates are provided for geocoding
    if (typeof body.lat === "number" && typeof body.lon === "number") {
      const { lat, lon } = body

      const apiKey = process.env.OPENCAGE_API_KEY

      if (!apiKey) {
        console.error("OPENCAGE_API_KEY environment variable is not set")
        return new Response(JSON.stringify({ error: "API configuration error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      const opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`
      const response = await fetch(opencageUrl)

      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status}`)
      }

      const data: OpenCageResponse = await response.json()

      let city = "Unknown"
      if (data.results && data.results.length > 0) {
        const components = data.results[0].components
        city = components.city || components.town || components.village || components.municipality || "Unknown"
      }

      console.log(`Reverse geocoded coordinates (${lat}, ${lon}) to city: ${city}`)
      await setLatestCity(city, lat, lon)

      // Auto-trigger Tidbyt update
      const updateResult = await triggerTidbytUpdate()

      return new Response(
        JSON.stringify({
          city,
          autoUpdate: updateResult.success ? "success" : "failed",
          autoUpdateDetails: updateResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    // Check for new format with separate message, train, and optional color fields
    else if (typeof body.message === "string" && body.message.trim()) {
      const message = body.message.trim()
      const trainDetails = typeof body.train === "string" && body.train.trim() ? body.train.trim() : null
      const trainColor = typeof body.color === "string" && body.color.trim() ? body.color.trim() : null

      // Combine message and train details ONLY for time parsing
      let combinedMessage = message
      if (trainDetails) {
        combinedMessage = `${message} ${trainDetails}`
      }

      // Check if this message contains time information
      const parsedTime = parseTimeString(combinedMessage)

      if (parsedTime) {
        console.log(`Received countdown message: ${combinedMessage} (${parsedTime.hours}h ${parsedTime.minutes}m)`)
        await setCountdownMessage(combinedMessage, trainColor)

        // Auto-trigger Tidbyt update
        const updateResult = await triggerTidbytUpdate()

        return new Response(
          JSON.stringify({
            message: combinedMessage,
            originalMessage: message,
            trainDetails: trainDetails,
            trainColor: trainColor,
            countdown: true,
            duration: `${parsedTime.hours}h ${parsedTime.minutes}m`,
            autoUpdate: updateResult.success ? "success" : "failed",
            autoUpdateDetails: updateResult,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      } else {
        console.log(`Received message with details: ${message}, details: ${trainDetails}, color: ${trainColor}`)
        // Pass the separate fields, NOT the combined message
        await setLatestCity(message, undefined, undefined, trainColor, trainDetails)

        // Auto-trigger Tidbyt update
        const updateResult = await triggerTidbytUpdate()

        return new Response(
          JSON.stringify({
            message: message,
            originalMessage: message,
            trainDetails: trainDetails,
            trainColor: trainColor,
            autoUpdate: updateResult.success ? "success" : "failed",
            autoUpdateDetails: updateResult,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }
    // Check if a city/message string is provided (legacy format)
    else if (typeof body.city === "string" && body.city.trim()) {
      const message = body.city.trim()

      // Check if this message contains time information
      const parsedTime = parseTimeString(message)

      if (parsedTime) {
        console.log(`Received countdown message: ${message} (${parsedTime.hours}h ${parsedTime.minutes}m)`)
        await setCountdownMessage(message)

        // Auto-trigger Tidbyt update
        const updateResult = await triggerTidbytUpdate()

        return new Response(
          JSON.stringify({
            message,
            countdown: true,
            duration: `${parsedTime.hours}h ${parsedTime.minutes}m`,
            autoUpdate: updateResult.success ? "success" : "failed",
            autoUpdateDetails: updateResult,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      } else {
        console.log(`Received direct city input: ${message}`)
        await setLatestCity(message)

        // Auto-trigger Tidbyt update
        const updateResult = await triggerTidbytUpdate()

        return new Response(
          JSON.stringify({
            city: message,
            autoUpdate: updateResult.success ? "success" : "failed",
            autoUpdateDetails: updateResult,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    } else {
      return new Response(
        JSON.stringify({
          error:
            "Please provide either lat/lon coordinates, a city string, or a message with optional details (use the 'train' field for station/coffee/freeway) and optional color",
          examples: {
            geocoding: { lat: 40.7128, lon: -74.006 },
            legacy: { city: "New York" },
            countdown: { city: "Train (1 hour, 39 minutes)" },
            newFormat: { message: "On Train", train: "Union Station" },
            newFormatWithColor: { message: "On Train", train: "Union Station", color: "A" },
            newCountdown: { message: "Train (45 minutes)", train: "Red Line", color: "E" },
            coffeeShop: { message: "Coffee", train: "Starbucks on 5th Ave" },
            coffeeWithColor: { message: "Coffee", train: "Blue Bottle Coffee", color: "coffee" },
            driving: { message: "Driving", train: "110 Freeway" },
          },
          colorCodes: {
            A: "Blue line",
            E: "Gold line", 
            coffee: "Coffee brown color",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error in location API:", error)

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
