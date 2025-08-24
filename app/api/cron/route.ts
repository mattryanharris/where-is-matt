import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"
import { createGunzip } from "zlib"
import { pipeline } from "stream/promises"
import { getIconForMessage } from "@/lib/icon-matcher"

const execAsync = promisify(exec)

// Simple tar parser for extracting files
async function extractTarGz(tarGzPath: string, extractDir: string): Promise<void> {
  const tarPath = path.join(extractDir, "pixlet.tar")

  // First, decompress the gzip
  const readStream = fs.createReadStream(tarGzPath)
  const writeStream = fs.createWriteStream(tarPath)
  const gunzip = createGunzip()

  await pipeline(readStream, gunzip, writeStream)
  console.log("Decompressed gzip file")

  // Now parse the tar file manually
  const tarBuffer = await fs.promises.readFile(tarPath)
  let offset = 0

  while (offset < tarBuffer.length) {
    // Read tar header (512 bytes)
    if (offset + 512 > tarBuffer.length) break

    const header = tarBuffer.subarray(offset, offset + 512)

    // Check if this is a valid header (not all zeros)
    const isValidHeader = header.some((byte) => byte !== 0)
    if (!isValidHeader) break

    // Extract filename (first 100 bytes, null-terminated)
    const nameBytes = header.subarray(0, 100)
    const nameEnd = nameBytes.indexOf(0)
    const filename = nameBytes.subarray(0, nameEnd > 0 ? nameEnd : 100).toString("utf8")

    // Extract file size (bytes 124-135, octal)
    const sizeStr = header.subarray(124, 136).toString("utf8").replace(/\0/g, "").trim()
    const fileSize = sizeStr ? Number.parseInt(sizeStr, 8) : 0

    // Extract file type (byte 156)
    const fileType = header[156]

    console.log(`Found file: ${filename}, size: ${fileSize}, type: ${fileType}`)

    offset += 512 // Skip header

    if (fileSize > 0 && fileType === 48) {
      // 48 = '0' = regular file
      // Extract file data
      const fileData = tarBuffer.subarray(offset, offset + fileSize)

      // Check if this is the pixlet binary
      if (filename.includes("pixlet") && !filename.includes(".") && filename !== "pixlet/") {
        const outputPath = path.join(extractDir, "pixlet")
        await fs.promises.writeFile(outputPath, fileData)
        console.log(`Extracted pixlet binary to: ${outputPath}`)
      }

      // Round up to next 512-byte boundary
      const paddedSize = Math.ceil(fileSize / 512) * 512
      offset += paddedSize
    }
  }

  // Clean up tar file
  await fs.promises.unlink(tarPath)
}

async function verifyPixletBinary(pixletPath: string): Promise<boolean> {
  try {
    // Check if file exists
    await fs.promises.access(pixletPath, fs.constants.F_OK)

    // Check if it's executable
    await fs.promises.access(pixletPath, fs.constants.X_OK)

    // Try to run pixlet version to verify it works
    const { stdout } = await execAsync(`${pixletPath} version`, { timeout: 10000 })
    console.log(`Pixlet version check: ${stdout.trim()}`)

    return true
  } catch (error: any) {
    console.log(`Pixlet binary verification failed: ${error.message}`)
    return false
  }
}

async function ensurePixletBinary(): Promise<string> {
  const pixletPath = path.join("/tmp", "pixlet_binary")

  // First, check if pixlet exists and works
  const isValid = await verifyPixletBinary(pixletPath)
  if (isValid) {
    console.log("Pixlet binary already exists and is working")
    return pixletPath
  }

  console.log("Pixlet binary not found or not working, downloading...")

  // Remove existing binary if it exists but doesn't work
  try {
    await fs.promises.unlink(pixletPath)
    console.log("Removed invalid pixlet binary")
  } catch (error) {
    // Ignore if file doesn't exist
  }

  // Try multiple download URLs (latest first)
  const downloadUrls = [
    "https://github.com/tidbyt/pixlet/releases/download/v0.34.0/pixlet_0.34.0_linux_amd64.tar.gz",
    "https://github.com/tidbyt/pixlet/releases/download/v0.33.8/pixlet_0.33.8_linux_amd64.tar.gz",
    "https://github.com/tidbyt/pixlet/releases/download/v0.33.7/pixlet_0.33.7_linux_amd64.tar.gz",
  ]

  for (const downloadUrl of downloadUrls) {
    try {
      console.log(`Trying to download pixlet from: ${downloadUrl}`)
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        console.log(`Failed to download from ${downloadUrl}: ${response.status} ${response.statusText}`)
        continue
      }

      console.log(`Successfully fetched from ${downloadUrl}`)

      // Handle tar.gz files
      const buffer = await response.arrayBuffer()
      const tarGzPath = path.join("/tmp", "pixlet.tar.gz")
      await fs.promises.writeFile(tarGzPath, Buffer.from(buffer))

      // Extract the tar.gz file using our custom extractor
      console.log("Extracting tar.gz file...")
      await extractTarGz(tarGzPath, "/tmp")

      // Look for the extracted pixlet binary
      const extractedPixletPath = path.join("/tmp", "pixlet")
      try {
        await fs.promises.access(extractedPixletPath, fs.constants.F_OK)
        // Copy to our expected location
        await fs.promises.copyFile(extractedPixletPath, pixletPath)
        console.log(`Found and copied binary from ${extractedPixletPath}`)
      } catch (error) {
        throw new Error("Could not find extracted pixlet binary")
      }

      // Make it executable
      await execAsync(`chmod +x ${pixletPath}`)

      // Clean up temporary files
      await fs.promises.unlink(tarGzPath)
      await fs.promises.unlink(extractedPixletPath)

      // Verify the downloaded binary works
      const isValid = await verifyPixletBinary(pixletPath)
      if (!isValid) {
        throw new Error("Downloaded pixlet binary is not working")
      }

      console.log(`Successfully downloaded and verified pixlet binary: ${pixletPath}`)
      return pixletPath
    } catch (error: any) {
      console.log(`Failed to download from ${downloadUrl}: ${error.message}`)
      continue
    }
  }

  throw new Error("Failed to download pixlet binary from all attempted URLs")
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
    "/tmp/pixlet.tar.gz", // cleanup download artifacts
    "/tmp/pixlet.tar",
    "/tmp/pixlet", // extracted binary (we keep pixlet_binary)
    // Clean up any downloaded icon files
    "/tmp/coffee.png",
    "/tmp/walk.png",
    "/tmp/train.png",
    "/tmp/home.png",
    "/tmp/work.png",
  ]

  for (const file of filesToClean) {
    try {
      await fs.promises.unlink(file)
      console.log(`Cleaned up: ${file}`)
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  // Try to kill any hanging pixlet processes
  try {
    await execAsync("pkill -f pixlet", { timeout: 5000 })
    console.log("Killed any hanging pixlet processes")
  } catch (error) {
    // Ignore errors - process might not exist
  }
}

async function downloadAndConvertIcon(iconName: string, iconUrl: string): Promise<string | null> {
  const pngPath = path.join("/tmp", `${iconName}.png`)

  try {
    // Check if PNG already exists
    await fs.promises.access(pngPath, fs.constants.F_OK)
    console.log(`Icon ${iconName}.png already exists`)
    return pngPath
  } catch (error) {
    // Icon doesn't exist, download and convert it
    console.log(`Downloading and converting icon: ${iconName}`)

    try {
      const response = await fetch(iconUrl)
      if (!response.ok) {
        throw new Error(`Failed to download icon ${iconName}: ${response.status}`)
      }

      const webpBuffer = await response.arrayBuffer()
      const webpPath = path.join("/tmp", `${iconName}_temp.webp`)

      // Save WebP temporarily
      await fs.promises.writeFile(webpPath, Buffer.from(webpBuffer))

      // Convert WebP to PNG using ImageMagick (if available) or skip
      try {
        await execAsync(`convert "${webpPath}" "${pngPath}"`, { timeout: 10000 })
        console.log(`Successfully converted ${iconName} from WebP to PNG`)

        // Clean up temp WebP
        await fs.promises.unlink(webpPath)

        return pngPath
      } catch (convertError) {
        console.log(`ImageMagick not available, trying alternative approach for ${iconName}`)

        // Clean up temp files
        try {
          await fs.promises.unlink(webpPath)
        } catch (e) {}

        // Return null to indicate we should skip the icon
        return null
      }
    } catch (error: any) {
      console.log(`Failed to download/convert icon ${iconName}:`, error.message)
      return null
    }
  }
}

async function createStarFile(): Promise<string> {
  const starfilePath = path.join("/tmp", "location.star")

  // Get the message and train info from the API
  let message = "Unavailable"
  let trainDetails = null
  let trainColor = null

  try {
    const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/message"
    const response = await fetch(apiUrl)
    if (response.ok) {
      const data = await response.json()
      // Use the original message, not the combined one
      message = data.message || "Unavailable"
      trainDetails = data.train // Will be train details string or null
      trainColor = data.color // Will be train color code or null

      // Extract just the main message part (before any train details)
      if (message.includes(" Union Station") || message.includes(" Red Line") || message.includes(" Blue Line")) {
        // If the message contains common train station patterns, extract just the first part
        const parts = message.split(" ")
        if (parts.length > 2 && parts[0] === "On" && parts[1] === "Train") {
          message = "On Train"
          // The train details should already be in the trainDetails field
        }
      }

      message = message.trim().substring(0, 20) // Limit length for display
    }
  } catch (error) {
    console.log("Failed to fetch message, using default")
  }

  // Determine train line color based on color code
  let trainLineColor = "#0ff" // Default cyan color
  if (trainColor === "A") {
    trainLineColor = "#4da6ff" // Lighter blue for A line (was "#00f")
  } else if (trainColor === "E") {
    trainLineColor = "#ffd700" // Gold for E line
  } else if (trainColor === "coffee") {
    trainLineColor = "#D2691E" // Lighter coffee/chocolate color (was "#8B4513")
  }

  // Check if message matches any icon keywords
  const iconMatch = getIconForMessage(message)
  let iconElement = ""

  if (iconMatch.iconPath && iconMatch.iconName) {
    console.log(`Found icon match: ${iconMatch.iconName} for message: "${message}"`)

    // Map icon names to their blob URLs
    const iconUrls: Record<string, string> = {
      coffee: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/coffee-kQL1s0tYusJlppk8eY1RHlO9AdVhjz.webp",
      walk: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/walk-Z0063ioIfRM74jZN77ymzH1oPLKziO.webp",
      train: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/train-xQtY80aBSxbtfJN9RmmoQnXPQynktu.webp",
      home: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home-hWamWBR5thwInUBKh32tnjPtwH7tw2.webp",
      work: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/work-bnoh869aTcvK1hBCbUTIzYXPZs20T1.webp",
    }

    const iconUrl = iconUrls[iconMatch.iconName]
    if (iconUrl) {
      const pngPath = await downloadAndConvertIcon(iconMatch.iconName, iconUrl)
      if (pngPath) {
        // Use the PNG file with proper Pixlet syntax
        iconElement = `
                render.Image(
                    src = "${iconMatch.iconName}.png",
                    width = 16,
                    height = 16,
                ),
                render.Box(width=2),`
        console.log(`Added PNG icon element for ${iconMatch.iconName}`)
      } else {
        console.log(`Could not convert icon ${iconMatch.iconName}, proceeding without icon`)
      }
    }
  }

  // Create star file with optional PNG icon and optional third line for train details
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
                    color = "#fff",
                ),
                render.Box(height=1),
                render.Row(
                    main_align="left",
                    cross_align="center",
                    children = [${iconElement}
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
                    color = "${trainLineColor}",
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
                    color = "#fff",
                ),
                render.Box(height=2),
                render.Row(
                    main_align="left",
                    cross_align="center",
                    children = [${iconElement}
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

  try {
    await fs.promises.writeFile(starfilePath, starContent)
    console.log(`Created .star file at: ${starfilePath}`)
    console.log(`Message content: "${message}"`)
    if (trainDetails) {
      console.log(`Train details: "${trainDetails}"`)
    }
    if (iconMatch.iconName) {
      console.log(`With icon: ${iconMatch.iconName}`)
    }

    // Verify the file was written correctly
    const writtenContent = await fs.promises.readFile(starfilePath, "utf8")
    if (writtenContent !== starContent) {
      throw new Error("Star file content verification failed")
    }

    return starfilePath
  } catch (error: any) {
    throw new Error(`Failed to create .star file: ${error.message}`)
  }
}

async function updateTidbyt() {
  // --- 1. Clean up temporary files (but keep pixlet binary) ---
  await cleanupTempFiles()

  // --- 2. Get Environment Variables ---
  const { TIDBYT_DEVICE_ID, TIDBYT_API_TOKEN } = process.env
  const INSTALLATION_ID = "whereismatt"

  if (!TIDBYT_DEVICE_ID || !TIDBYT_API_TOKEN) {
    console.error("Missing Tidbyt environment variables")
    console.error("TIDBYT_DEVICE_ID:", TIDBYT_DEVICE_ID ? "Set" : "Missing")
    console.error("TIDBYT_API_TOKEN:", TIDBYT_API_TOKEN ? "Set" : "Missing")
    throw new Error("Server configuration error - missing Tidbyt credentials")
  }

  console.log(`Using Device ID: ${TIDBYT_DEVICE_ID}`)
  console.log(`API Token length: ${TIDBYT_API_TOKEN.length} characters`)

  // --- 3. Ensure pixlet binary exists (download only if needed) ---
  const pixletBinaryPath = await ensurePixletBinary()

  // --- 4. Create .star file ---
  const starfilePath = await createStarFile()

  // --- 5. Define output path ---
  const outputPath = path.join("/tmp", "location.webp")

  // --- 6. Render the .star file to a .webp image ---
  const renderCommand = `${pixletBinaryPath} render ${starfilePath} -o ${outputPath}`
  console.log(`Executing render command: ${renderCommand}`)

  try {
    const { stdout: renderStdout, stderr: renderStderr } = await execAsync(renderCommand, {
      timeout: 30000, // 30 second timeout
    })
    if (renderStderr) console.error(`Render Stderr: ${renderStderr}`)
    console.log(`Render Stdout: ${renderStdout}`)
    console.log(`Successfully rendered WEBP file to ${outputPath}`)
  } catch (error: any) {
    console.error(`Full render error:`, error)
    throw new Error(`Pixlet render failed: ${error.message}. Stderr: ${error.stderr}`)
  }

  // --- 7. Verify the webp file was created ---
  try {
    const stats = await fs.promises.stat(outputPath)
    console.log(`WEBP file created successfully: ${stats.size} bytes`)
  } catch (error) {
    throw new Error("WEBP file was not created after render command")
  }

  // --- 8. Push the rendered image to Tidbyt ---
  const pushCommand = `${pixletBinaryPath} push --api-token "${TIDBYT_API_TOKEN}" "${TIDBYT_DEVICE_ID}" "${outputPath}" --installation-id "${INSTALLATION_ID}"`
  console.log(
    `Executing push command: ${pixletBinaryPath} push --api-token "[REDACTED]" "${TIDBYT_DEVICE_ID}" "${outputPath}" --installation-id "${INSTALLATION_ID}"`,
  )

  try {
    const { stdout: pushStdout, stderr: pushStderr } = await execAsync(pushCommand, {
      timeout: 30000, // 30 second timeout
    })
    if (pushStderr) console.error(`Push Stderr: ${pushStderr}`)
    console.log(`Push Stdout: ${pushStdout}`)
    console.log("Successfully pushed update to Tidbyt device.")
  } catch (error: any) {
    console.error(`Push command failed: ${error.message}`)
    console.error(`Push stderr: ${error.stderr}`)
    throw new Error(`Pixlet push failed: ${error.message}. Stderr: ${error.stderr}`)
  }

  // --- 9. Keep the webp file for public access ---
  console.log(`Keeping WEBP file available at: ${outputPath}`)
  console.log(`Public URL: /api/tidbyt-image`)

  return {
    success: true,
    message: "Tidbyt display updated successfully",
    timestamp: new Date().toISOString(),
    binaryPath: pixletBinaryPath,
    starfilePath: starfilePath,
    deviceId: TIDBYT_DEVICE_ID,
    installationId: INSTALLATION_ID,
    imageUrl: "/api/tidbyt-image",
    webpPath: outputPath,
  }
}

// Handle automatic cron job (GET)
export async function GET(request: NextRequest) {
  try {
    console.log("Cron job triggered automatically")
    const result = await updateTidbyt()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Cron job failed:", error)
    return NextResponse.json(
      {
        error: "Failed to update Tidbyt display",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Handle manual trigger (POST)
export async function POST(request: NextRequest) {
  try {
    console.log("Manual Tidbyt update triggered")
    const result = await updateTidbyt()
    return NextResponse.json({
      ...result,
      triggeredBy: "manual",
    })
  } catch (error: any) {
    console.error("Manual update failed:", error)
    return NextResponse.json(
      {
        error: "Failed to update Tidbyt display",
        details: error.message,
        timestamp: new Date().toISOString(),
        triggeredBy: "manual",
      },
      { status: 500 },
    )
  }
}
