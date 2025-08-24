import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function POST() {
  const result = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
  }

  try {
    // Step 1: Check environment variables
    const { TIDBYT_DEVICE_ID, TIDBYT_API_TOKEN } = process.env
    const INSTALLATION_ID = "whereismatt"

    if (!TIDBYT_DEVICE_ID || !TIDBYT_API_TOKEN) {
      throw new Error("Missing Tidbyt environment variables")
    }

    result.steps.push("✅ Environment variables verified")

    // Step 2: Check if pixlet binary exists
    const pixletPath = path.join("/tmp", "pixlet_binary")
    try {
      await fs.promises.access(pixletPath, fs.constants.F_OK)
      result.steps.push("✅ Pixlet binary found")
    } catch (error) {
      throw new Error("Pixlet binary not found - run update first")
    }

    // Step 3: Check if webp image exists
    const webpPath = path.join("/tmp", "location.webp")
    try {
      const stats = await fs.promises.stat(webpPath)
      result.steps.push(`✅ WEBP image found (${stats.size} bytes)`)
    } catch (error) {
      throw new Error("WEBP image not found - run generate first")
    }

    // Step 4: Push to Tidbyt
    const pushCommand = `${pixletPath} push --api-token "${TIDBYT_API_TOKEN}" "${TIDBYT_DEVICE_ID}" "${webpPath}" --installation-id "${INSTALLATION_ID}"`

    result.steps.push("🚀 Pushing image to Tidbyt...")
    console.log(
      `Executing push command: ${pixletPath} push --api-token "[REDACTED]" "${TIDBYT_DEVICE_ID}" "${webpPath}" --installation-id "${INSTALLATION_ID}"`,
    )

    const { stdout, stderr } = await execAsync(pushCommand, { timeout: 30000 })

    if (stderr) {
      console.error(`Push stderr: ${stderr}`)
      result.steps.push(`⚠️ Push stderr: ${stderr}`)
    }

    if (stdout) {
      console.log(`Push stdout: ${stdout}`)
      result.steps.push(`📝 Push stdout: ${stdout}`)
    }

    result.steps.push("✅ Successfully pushed to Tidbyt device")
    result.success = true

    return NextResponse.json({
      ...result,
      message: "Image successfully pushed to Tidbyt",
      deviceId: TIDBYT_DEVICE_ID,
      installationId: INSTALLATION_ID,
    })
  } catch (error: any) {
    console.error("Push to Tidbyt failed:", error)
    result.steps.push(`❌ Error: ${error.message}`)

    return NextResponse.json(
      {
        ...result,
        error: "Failed to push to Tidbyt",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
