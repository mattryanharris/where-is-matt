export const runtime = "edge"

export async function POST() {
  const result = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
  }

  try {
    result.steps.push("🧪 Testing auto-trigger functionality...")

    // Test the same logic as the location endpoint
    const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/cron"

    result.steps.push(`📡 Making request to: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45000), // 45 second timeout
    })

    result.steps.push(`📊 Response status: ${response.status}`)

    if (response.ok) {
      const cronResult = await response.json()
      result.steps.push("✅ Cron endpoint responded successfully")
      result.steps.push(`📝 Cron result: ${cronResult.message}`)
      result.success = true

      return new Response(
        JSON.stringify({
          ...result,
          message: "Auto-trigger test successful",
          cronResult: cronResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } else {
      const errorText = await response.text()
      result.steps.push(`❌ Cron endpoint failed: ${response.status}`)
      result.steps.push(`❌ Error details: ${errorText}`)

      return new Response(
        JSON.stringify({
          ...result,
          message: "Auto-trigger test failed",
          error: `HTTP ${response.status}: ${errorText}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    result.steps.push(`❌ Test failed with error: ${error.message}`)

    return new Response(
      JSON.stringify({
        ...result,
        message: "Auto-trigger test failed",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
