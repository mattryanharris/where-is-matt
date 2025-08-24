// Simple time parsing test without imports

function parseTimeString(text) {
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

// Test cases for various time formats
const testCases = [
  "Bus (45 minutes)",
  "Train (1 hour, 39 minutes)",
  "Meeting (2 hours)",
  "Delivery (15 min)",
  "Flight (1 hr, 30 min)",
  "Appointment (45 mins)",
  "Call (1 hr)",
  "Break (30 m)",
  "Lunch (1 h, 15 m)",
  "Workshop (2 hrs, 45 mins)",
  "Conference (3 hours, 30 minutes)",
  "Taxi (20 min)",
  "Bus (1hr 15min)", // No comma or spaces
  "Train (2h 45m)", // Very short format
]

console.log("Testing time parsing with various formats:\n")

testCases.forEach((testCase) => {
  console.log(`\n--- Testing: "${testCase}" ---`)
  const result = parseTimeString(testCase)
  if (result) {
    console.log(`✅ SUCCESS: ${result.hours}h ${result.minutes}m (${result.totalMinutes} total minutes)`)
  } else {
    console.log(`❌ FAILED: Could not parse time`)
  }
})

console.log("\n\n=== Testing edge cases ===")

const edgeCases = [
  "No time here",
  "Meeting in 5", // No unit
  "Bus (0 minutes)", // Zero time
  "Train (minutes)", // No number
  "Flight (1 hour, minutes)", // Missing minute number
]

edgeCases.forEach((testCase) => {
  console.log(`\n--- Edge case: "${testCase}" ---`)
  const result = parseTimeString(testCase)
  console.log(`Result: ${result ? `${result.hours}h ${result.minutes}m` : "null (expected for invalid input)"}`)
})

console.log("\n\n=== Summary ===")
console.log("The parser should handle:")
console.log("- Full words: hour, hours, minute, minutes")
console.log("- Abbreviations: hr, hrs, min, mins")
console.log("- Single letters: h, m")
console.log("- Various separators: commas, 'and', spaces")
