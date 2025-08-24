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
      throw new Error("Pixlet binary not found - run prepare or update first")
    }

    // Step 3: Look for any webp files in /tmp
    const possibleWebpFiles = ["/tmp/location.webp", "/tmp/simple.webp", "/tmp/test.webp"]

    let webpPath = null
    let webpStats = null

    for (const filePath of possibleWebpFiles) {
      try {
        const stats = await fs.promises.stat(filePath)
        webpPath = filePath
        webpStats = stats
        result.steps.push(`✅ Found webp file: ${path.basename(filePath)} (${stats.size} bytes)`)
        break // Use the first one we find
      } catch (error) {
        // File doesn't exist, try next one
      }
    }

    if (!webpPath) {
      // Check what files ARE in /tmp
      try {
        const tmpContents = await fs.promises.readdir("/tmp")
        const webpFiles = tmpContents.filter((file) => file.endsWith(".webp"))

        if (webpFiles.length > 0) {
          // Use the first webp file we find
          webpPath = path.join("/tmp", webpFiles[0])
          const stats = await fs.promises.stat(webpPath)
          webpStats = stats
          result.steps.push(`✅ Found webp file: ${webpFiles[0]} (${stats.size} bytes)`)
        } else {
          throw new Error(`No webp files found in /tmp. Available files: ${tmpContents.join(", ")}`)
        }
      } catch (error) {
        throw new Error("No webp files found - run generate or prepare first")
      }
    }

    // Step 4: Push to Tidbyt
    const pushCommand = `${pixletPath} push --api-token "${TIDBYT_API_TOKEN}" "${TIDBYT_DEVICE_ID}" "${webpPath}" --installation-id "${INSTALLATION_ID}"`

    result.steps.push(`🚀 Pushing ${path.basename(webpPath)} to Tidbyt...`)
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

    result.steps.push("✅ Successfully pushed webp to Tidbyt device")
    result.success = true

    return NextResponse.json({
      ...result,
      message: `Successfully sent ${path.basename(webpPath)} to Tidbyt`,
      deviceId: TIDBYT_DEVICE_ID,
      installationId: INSTALLATION_ID,
      fileSent: path.basename(webpPath),
      fileSize: webpStats?.size,
    })
  } catch (error: any) {
    console.error("Send webp to Tidbyt failed:", error)
    result.steps.push(`❌ Error: ${error.message}`)

    return NextResponse.json(
      {
        ...result,
        error: "Failed to send webp to Tidbyt",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
