import { createServerClient } from "./supabase"
import { parseTimeString, calculateTargetTime } from "./time-parser"

interface LocationRecord {
  id: number
  city?: string
  message?: string
  latitude?: number
  longitude?: number
  target_time?: string
  has_countdown: boolean
  created_at: string
  train_info?: string // Store train details
  train_color?: string // Store train line color
}

function parseTrainInfo(message: string): { hasTrain: boolean; details?: string } {
  if (!message.toLowerCase().includes("train")) {
    return { hasTrain: false }
  }

  // Updated patterns to handle both hyphenated and non-hyphenated formats:
  // "On Train - Red Line to Downtown" (with hyphen)
  // "On Train Union Station" (without hyphen)
  // "Train (5 minutes delayed)"

  // First try the hyphenated format
  const hyphenMatch = message.match(/train\s*[-–—]\s*(.+)/i)
  if (hyphenMatch && hyphenMatch[1]) {
    return {
      hasTrain: true,
      details: hyphenMatch[1].trim(),
    }
  }

  // Then try "On Train [details]" format (without hyphen)
  const onTrainMatch = message.match(/on\s+train\s+(.+)/i)
  if (onTrainMatch && onTrainMatch[1]) {
    return {
      hasTrain: true,
      details: onTrainMatch[1].trim(),
    }
  }

  // Try "Train [details]" format (without hyphen)
  const trainMatch = message.match(/^train\s+(.+)/i)
  if (trainMatch && trainMatch[1]) {
    return {
      hasTrain: true,
      details: trainMatch[1].trim(),
    }
  }

  // Try parenthetical format like "Train (5 minutes delayed)"
  const parenMatch = message.match(/train\s*$$([^)]+)$$/i)
  if (parenMatch && parenMatch[1]) {
    return {
      hasTrain: true,
      details: parenMatch[1].trim(),
    }
  }

  // If no specific details found, just return "train"
  return {
    hasTrain: true,
    details: "train",
  }
}

export async function setLatestCity(city: string, lat?: number, lon?: number, trainColor?: string, trainDetails?: string) {
  try {
    const supabase = createServerClient()

    // If trainDetails is provided directly, use it. Otherwise try to parse from city
    let trainInfoValue = trainDetails
    let displayMessage = city

    if (!trainDetails) {
      // Legacy behavior - parse train info from the combined message
      const trainInfo = parseTrainInfo(city)
      trainInfoValue = trainInfo.hasTrain ? trainInfo.details : null

      // For the new format, extract just the main message part
      if (trainInfo.hasTrain && city.includes(" ")) {
        // If it's "On Train Union Station", store "On Train" as message
        const parts = city.split(" ")
        if (parts.length > 2 && parts[0] === "On" && parts[1] === "Train") {
          displayMessage = "On Train"
        }
      }
    }

    const { error } = await supabase.from("locations").insert({
      city: displayMessage, // Store the clean message part
      latitude: lat,
      longitude: lon,
      has_countdown: false,
      train_info: trainInfoValue,
      train_color: trainColor,
    })

    if (error) {
      if (error.code === "42P01") {
        console.error("Locations table doesn't exist. Please run: scripts/01-create-locations-table.sql")
        return
      }
      console.error("Supabase insert error:", error)
      throw error
    }

    console.log(`Successfully stored city: ${displayMessage}`)
    if (trainInfoValue) {
      console.log(`With train info: ${trainInfoValue}`)
    }
    if (trainColor) {
      console.log(`With train color: ${trainColor}`)
    }
  } catch (error) {
    console.error("Failed to store city:", error)
  }
}

export async function setCountdownMessage(message: string, trainColor?: string) {
  try {
    const supabase = createServerClient()

    console.log(`Processing countdown message: "${message}"`)

    // Parse time from the message
    const parsedTime = parseTimeString(message)
    console.log(`Parsed time result:`, parsedTime)

    // Parse train info
    const trainInfo = parseTrainInfo(message)
    const trainInfoValue = trainInfo.hasTrain ? trainInfo.details : null

    // For the new format, extract just the main message part
    let displayMessage = message
    if (trainInfo.hasTrain && message.includes(" ")) {
      const parts = message.split(" ")
      if (parts.length > 2 && parts[0] === "On" && parts[1] === "Train") {
        displayMessage = "On Train"
      }
    }

    let targetTime = null
    let hasCountdown = false

    if (parsedTime) {
      targetTime = calculateTargetTime(parsedTime.totalMinutes)
      hasCountdown = true
      console.log(
        `Created countdown - Duration: ${parsedTime.totalMinutes} minutes, Target: ${targetTime.toISOString()}`,
      )
    } else {
      console.log(`No time found in message, storing as regular message`)
    }

    const insertData = {
      message: displayMessage, // Store the clean message part
      target_time: targetTime?.toISOString(),
      has_countdown: hasCountdown,
      train_info: trainInfoValue,
      train_color: trainColor,
    }

    console.log(`Inserting data:`, insertData)

    const { error } = await supabase.from("locations").insert(insertData)

    if (error) {
      if (error.code === "42P01") {
        console.error("Locations table doesn't exist. Please run the database migrations.")
        return
      }
      console.error("Supabase insert error:", error)
      throw error
    }

    console.log(`Successfully stored message with countdown: ${hasCountdown}`)
    if (trainInfoValue) {
      console.log(`With train info: ${trainInfoValue}`)
    }
    if (trainColor) {
      console.log(`With train color: ${trainColor}`)
    }
  } catch (error) {
    console.error("Failed to store message:", error)
  }
}

export async function getLatestLocation(): Promise<LocationRecord | null> {
  try {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables not configured")
      return null
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      if (error.code === "42P01") {
        console.log("Locations table doesn't exist yet. Please run the database migration.")
        return null
      }
      console.error("Supabase select error:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("No location records found")
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Failed to retrieve location:", error)
    return null
  }
}

// Keep backward compatibility
export async function getLatestCity(): Promise<string | null> {
  try {
    const location = await getLatestLocation()
    return location?.city || location?.message || null
  } catch (error) {
    console.error("Failed to retrieve latest city:", error)
    return null
  }
}

export async function getLocationHistory(limit = 10): Promise<LocationRecord[]> {
  try {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables not configured")
      return []
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Supabase select error:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Failed to retrieve location history:", error)
    return []
  }
}
