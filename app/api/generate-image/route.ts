import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

async function verifyPixletBinary(pixletPath: string): Promise<boolean> {
  try {
    await fs.promises.access(pixletPath, fs.constants.F_OK)
    await fs.promises.access(pixletPath, fs.constants.X_OK)
    const { stdout } = await execAsync(`${pixletPath} version`, { timeout: 10000 })
    console.log(`Pixlet version check: ${stdout.trim()}`)
    return true
  } catch (error: any) {
    console.log(`Pixlet binary verification failed: ${error.message}`)
    return false
  }
}

async function cleanupTempFiles(): Promise<void> {
  console.log("Cleaning up temporary files...")

  // Only clean up temporary files, NOT the pixlet binary
  const filesToClean = [
    "/tmp/location.star",
    "/tmp/simple.star",
    "/tmp/current.star",
    "/tmp/test.star",
    "/tmp/location.webp",
    "/tmp/simple.webp",
    "/tmp/test.webp",
  ]

  for (const file of filesToClean) {
    try {
      await fs.promises.unlink(file)
      console.log(`Cleaned up: ${file}`)
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  try {
    await execAsync("pkill -f pixlet", { timeout: 5000 })
    console.log("Killed any hanging pixlet processes")
  } catch (error) {
    // Ignore errors
  }
}

// Function to determine the icon based on the message
function getIconForMessage(message: string): { iconPath: string | null; iconName: string | null } {
  const messageLower = message.toLowerCase()

  if (messageLower.includes("delayed") || messageLower.includes("late")) {
    return { iconPath: "/assets/icons/train_delayed.webp", iconName: "train_delayed" }
  }

  return { iconPath: null, iconName: null }
}

export async function POST() {
  const result: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    error: null,
    details: null,
  }

  try {
    // Step 1: Clean up temporary files
    await cleanupTempFiles()
    result.steps.push("✅ Cleaned up temporary files")

    // Step 2: Get the current message
    let message = "Unavailable"
    try {
      const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/message/text"
      const response = await fetch(apiUrl)
      if (response.ok) {
        message = await response.text()
        message = message.trim().substring(0, 50)
      } else {
        result.steps.push(`⚠️ API returned ${response.status}, using default message`)
      }
    } catch (apiError: any) {
      result.steps.push(`⚠️ API fetch failed: ${apiError.message}, using default message`)
    }

    result.currentMessage = message
    result.steps.push(`✅ Retrieved message: "${message}"`)

    // Step 3: Check for pixlet binary and verify it works
    const pixletPath = path.join("/tmp", "pixlet_binary")
    const isValid = await verifyPixletBinary(pixletPath)

    if (!isValid) {
      const error = "Pixlet binary not found or not working"
      result.error = error
      result.details = "Try running 'Update Tidbyt Now' or 'Step 1: Prepare Only' first to download the binary"
      result.steps.push("❌ Pixlet binary not found or not working")
      result.steps.push("💡 Try running 'Update Tidbyt Now' first to download the binary")
      return NextResponse.json(result, { status: 400 })
    }

    result.steps.push("✅ Pixlet binary found and verified")

    // Step 4: Create star file with current message and train details
    const starPath = path.join("/tmp", "location.star")

    // Get train details from API
    let trainDetails = null
    try {
      const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/message"
      const response = await fetch(apiUrl)
      if (response.ok) {
        const data = await response.json()
        message = data.message || "Unavailable"
        trainDetails = data.train // Will be train details string or null
        message = message.trim().substring(0, 50) // Limit length
      }
    } catch (apiError: any) {
      result.steps.push(`⚠️ API fetch failed: ${apiError.message}, using default message`)
    }

    // Check if message matches any icon keywords
    const iconMatch = getIconForMessage(message)
    const iconElement = ""

    if (iconMatch.iconPath && iconMatch.iconName) {
      console.log(`Found icon match: ${iconMatch.iconName} for message: "${message}"`)
      // For now, skip icons in generate-image to avoid complexity
      // iconElement remains empty
    }

    // Create star file with optional third line for train details
    let starContent = ""

    if (trainDetails) {
      // Three-line layout with train details on third line
      starContent = `load("render.star", "render")

def main(ctx):
    return render.Root(
        child = render.Column(
            main_align="left",
            cross_align="left",
            children = [
                render.Text(
                    content = "Where's Matt?",
                    font = "5x8",
                    color = "#aaa",
                ),
                render.Box(height=1),
                render.Row(
                    main_align="left",
                    cross_align="center",
                    children = [
                        render.Text(
                            content = "${message.replace(/"/g, '\\"').replace(/\n/g, " ")}",
                            font = "6x13",
                            color = "#fff",
                        ),
                    ],
                ),
                render.Box(height=1),
                render.Text(
                    content = "${trainDetails.replace(/"/g, '\\"').substring(0, 40)}",
                    font = "5x8",
                    color = "#0ff",
                ),
            ],
        ),
    )
`
    } else {
      // Two-line layout without train details
      starContent = `load("render.star", "render")

def main(ctx):
    return render.Root(
        child = render.Column(
            main_align="left",
            cross_align="left",
            children = [
                render.Text(
                    content = "Where's Matt?",
                    font = "5x8",
                    color = "#aaa",
                ),
                render.Box(height=2),
                render.Row(
                    main_align="left",
                    cross_align="center",
                    children = [
                        render.Text(
                            content = "${message.replace(/"/g, '\\"').replace(/\n/g, " ")}",
                            font = "6x13",
                            color = "#fff",
                        ),
                    ],
                ),
            ],
        ),
    )
`
    }

    await fs.promises.writeFile(starPath, starContent)

    // Verify the file was written correctly
    const writtenContent = await fs.promises.readFile(starPath, "utf8")
    if (writtenContent !== starContent) {
      const error = "Star file content verification failed"
      result.error = error
      result.details = "The .star file was not written correctly"
      result.steps.push("❌ Star file content verification failed")
      return NextResponse.json(result, { status: 500 })
    }

    result.starContent = starContent
    result.steps.push("✅ Created and verified location.star file")

    // Step 5: Render the image
    const outputPath = path.join("/tmp", "location.webp")
    const renderCommand = `${pixletPath} render ${starPath} -o ${outputPath}`

    result.steps.push(`🔄 Executing: ${renderCommand}`)

    try {
      const { stdout, stderr } = await execAsync(renderCommand, { timeout: 30000 })

      result.renderOutput = { stdout, stderr }

      if (stderr) {
        result.steps.push(`⚠️ Render stderr: ${stderr}`)
      }

      if (stdout) {
        result.steps.push(`📝 Render stdout: ${stdout}`)
      }
    } catch (renderError: any) {
      const error = `Render command failed: ${renderError.message}`
      result.error = error
      result.details = `Command: ${renderCommand}\nStderr: ${renderError.stderr || "None"}\nStdout: ${renderError.stdout || "None"}`
      result.steps.push(`❌ Render command failed: ${renderError.message}`)
      if (renderError.stderr) {
        result.steps.push(`❌ Render stderr: ${renderError.stderr}`)
      }
      return NextResponse.json(result, { status: 500 })
    }

    // Step 6: Verify the file was created
    try {
      const stats = await fs.promises.stat(outputPath)
      result.generatedFile = {
        path: outputPath,
        size: stats.size,
        created: stats.mtime.toISOString(),
      }
      result.steps.push(`✅ WEBP file created successfully (${stats.size} bytes)`)
      result.success = true
    } catch (statError: any) {
      const error = "WEBP file was not created"
      result.error = error
      result.details = `Expected file at: ${outputPath}\nStat error: ${statError.message}`
      result.steps.push("❌ WEBP file was not created")
      result.success = false
      return NextResponse.json(result, { status: 500 })
    }

    // Clean up star file
    try {
      await fs.promises.unlink(starPath)
    } catch (error) {
      // Ignore cleanup errors
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`
    result.details = error.stack || "No stack trace available"
    result.steps.push(`❌ Unexpected error: ${error.message}`)
    return NextResponse.json(result, { status: 500 })
  }
}
