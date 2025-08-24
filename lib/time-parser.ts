export interface ParsedTime {
  hours: number
  minutes: number
  totalMinutes: number
}

export function parseTimeString(text: string): ParsedTime | null {
  console.log(`Parsing time from: "${text}"`)

  // Enhanced regex to handle more abbreviations:
  // hours: hour, hours, hr, hrs, h
  // minutes: minute, minutes, min, mins, m
  const timeRegex = /(?:(\d+)\s*(?:hours?|hrs?|hr|h))?(?:,?\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|min|m))?/i
  const match = text.match(timeRegex)

  console.log(`Regex match result:`, match)

  if (!match) {
    // Try a more comprehensive fallback approach
    const hourMatch = text.match(/(\d+)\s*(?:hours?|hrs?|hr|h)(?!\w)/i)
    const minuteMatch = text.match(/(\d+)\s*(?:minutes?|mins?|min|m)(?!\w)/i)

    const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0
    const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0

    console.log(`Fallback parsing - hours: ${hours}, minutes: ${minutes}`)

    if (hours === 0 && minutes === 0) return null

    const result = {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
    }

    console.log(`Parsed result:`, result)
    return result
  }

  const hours = Number.parseInt(match[1] || "0", 10)
  const minutes = Number.parseInt(match[2] || "0", 10)

  console.log(`Primary parsing - hours: ${hours}, minutes: ${minutes}`)

  // Must have at least some time
  if (hours === 0 && minutes === 0) return null

  const result = {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  }

  console.log(`Final parsed result:`, result)
  return result
}

export function calculateTargetTime(totalMinutes: number): Date {
  const now = new Date()
  const target = new Date(now.getTime() + totalMinutes * 60 * 1000)
  console.log(`Calculating target time: ${totalMinutes} minutes from now = ${target.toISOString()}`)
  return target
}

export function formatTimeRemaining(targetTime: Date): string {
  const now = new Date()
  const diff = targetTime.getTime() - now.getTime()

  if (diff <= 0) return "Arrived!"

  const totalMinutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
