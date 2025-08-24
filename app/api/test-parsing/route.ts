export const runtime = "edge"

import { parseTimeString } from "@/lib/time-parser"

export async function GET() {
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
    "Taxi (20 min)",
  ]

  const results = testCases.map((testCase) => {
    const parsed = parseTimeString(testCase)
    return {
      input: testCase,
      parsed: parsed,
      success: parsed !== null,
    }
  })

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  })
}
