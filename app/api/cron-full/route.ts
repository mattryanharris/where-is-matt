import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const result = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    stepResults: {} as any,
  }

  try {
    console.log("🚀 Starting full cron job: Prepare -> Generate -> Send")
    result.steps.push("🚀 Starting full cron job workflow")

    // Step 1: Prepare Tidbyt (download binary, generate initial image, but DON'T send yet)
    console.log("🔧 Step 1: Preparing Tidbyt (binary + initial image, no push)...")
    result.steps.push("🔧 Step 1: Preparing Tidbyt (binary + initial image, no push)...")

    const prepareResponse = await fetch(`${request.nextUrl.origin}/api/prepare-tidbyt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const prepareResult = await prepareResponse.json()
    result.stepResults.prepare = prepareResult

    if (!prepareResponse.ok) {
      const errorMsg = prepareResult.error || prepareResult.details || "Unknown error"
      throw new Error(`Prepare Tidbyt failed: ${errorMsg}`)
    }

    result.steps.push("✅ Step 1 completed: Binary ready, initial image generated (not sent yet)")
    console.log("✅ Prepare Tidbyt completed successfully")

    // Step 2: Force Generate (create fresh webp image with latest data)
    console.log("🎨 Step 2: Generating fresh image with latest data...")
    result.steps.push("🎨 Step 2: Generating fresh image with latest data...")

    const generateResponse = await fetch(`${request.nextUrl.origin}/api/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const generateResult = await generateResponse.json()
    result.stepResults.generate = generateResult

    if (!generateResponse.ok) {
      const errorMsg = generateResult.error || generateResult.details || "Unknown error"
      const detailedError = `Force Generate failed: ${errorMsg}`

      // Add more context from the generate result
      if (generateResult.steps && generateResult.steps.length > 0) {
        result.steps.push("❌ Generate steps that were completed:")
        generateResult.steps.forEach((step: string) => {
          result.steps.push(`   ${step}`)
        })
      }

      throw new Error(detailedError)
    }

    result.steps.push("✅ Step 2 completed: Fresh image generated with latest data")
    console.log("✅ Force Generate completed successfully")

    // Step 3: Send the final generated image to Tidbyt
    console.log("📤 Step 3: Sending the final image to Tidbyt...")
    result.steps.push("📤 Step 3: Sending the final image to Tidbyt...")

    const pushResponse = await fetch(`${request.nextUrl.origin}/api/push-to-tidbyt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const pushResult = await pushResponse.json()
    result.stepResults.push = pushResult

    if (!pushResponse.ok) {
      const errorMsg = pushResult.error || pushResult.details || "Unknown error"
      throw new Error(`Push to Tidbyt failed: ${errorMsg}`)
    }

    result.steps.push("✅ Step 3 completed: Final image successfully sent to Tidbyt")
    console.log("✅ Push to Tidbyt completed successfully")

    // Final success
    result.success = true
    result.steps.push("🎉 Full cron job completed successfully!")
    console.log("🎉 Full cron job workflow completed successfully")

    return NextResponse.json({
      ...result,
      message: "Full cron job completed: Prepare -> Generate -> Send",
      imageUrl: "/api/tidbyt-image",
      triggeredBy: "cron-full",
      workflow: "Prepare (no push) -> Generate fresh -> Send final",
    })
  } catch (error: any) {
    console.error("❌ Full cron job failed:", error)
    result.steps.push(`❌ Error: ${error.message}`)

    return NextResponse.json(
      {
        ...result,
        error: "Full cron job failed",
        details: error.message,
        debugInfo: "Check individual step results for more details",
      },
      { status: 500 },
    )
  }
}

// Also handle manual trigger
export async function POST(request: NextRequest) {
  console.log("Manual full cron job triggered")
  return GET(request)
}
