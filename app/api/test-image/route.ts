import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    files: {},
    errors: [],
  }

  try {
    // Step 1: Check if webp file exists
    const webpPath = path.join("/tmp", "location.webp")
    debugInfo.webpPath = webpPath

    try {
      const stats = await fs.promises.stat(webpPath)
      debugInfo.files.webpExists = {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      }
      debugInfo.steps.push("✅ WEBP file exists")
    } catch (error) {
      debugInfo.files.webpExists = { exists: false }
      debugInfo.steps.push("❌ WEBP file does not exist")
    }

    // Step 2: Check /tmp directory contents
    try {
      const tmpContents = await fs.promises.readdir("/tmp")
      debugInfo.files.tmpContents = tmpContents
      debugInfo.steps.push(`✅ /tmp directory contains ${tmpContents.length} files`)
    } catch (error: any) {
      debugInfo.errors.push(`Failed to read /tmp: ${error.message}`)
      debugInfo.steps.push("❌ Could not read /tmp directory")
    }

    // Step 3: Check if pixlet binary exists
    const pixletPath = path.join("/tmp", "pixlet_binary")
    try {
      const stats = await fs.promises.stat(pixletPath)
      debugInfo.files.pixletBinary = {
        exists: true,
        size: stats.size,
        executable: !!(stats.mode & Number.parseInt("111", 8)),
      }
      debugInfo.steps.push("✅ Pixlet binary exists")
    } catch (error) {
      debugInfo.files.pixletBinary = { exists: false }
      debugInfo.steps.push("❌ Pixlet binary does not exist")
    }

    // Step 4: Test API endpoint
    try {
      const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/message/text"
      const response = await fetch(apiUrl)
      const text = await response.text()
      debugInfo.api = {
        url: apiUrl,
        status: response.status,
        response: text,
      }
      debugInfo.steps.push(`✅ API endpoint responded: ${response.status}`)
    } catch (error: any) {
      debugInfo.errors.push(`API test failed: ${error.message}`)
      debugInfo.steps.push("❌ API endpoint test failed")
    }

    // Step 5: Try to create a simple star file and render it
    if (debugInfo.files.pixletBinary?.exists) {
      try {
        const testStarPath = path.join("/tmp", "test.star")
        const testStarContent = `load("render.star", "render")

def main(ctx):
    return render.Root(
        child = render.Column(
            main_align="center",
            cross_align="center",
            children = [
                render.Text(
                    content = "Test Image",
                    font = "6x13",
                    color = "#fff",
                ),
            ],
        ),
    )
`
        await fs.promises.writeFile(testStarPath, testStarContent)
        debugInfo.steps.push("✅ Created test .star file")

        const testOutputPath = path.join("/tmp", "test.webp")
        const renderCommand = `${pixletPath} render ${testStarPath} -o ${testOutputPath}`

        const { stdout, stderr } = await execAsync(renderCommand, { timeout: 30000 })

        debugInfo.testRender = {
          command: renderCommand,
          stdout,
          stderr,
        }

        // Check if test file was created
        try {
          const testStats = await fs.promises.stat(testOutputPath)
          debugInfo.files.testWebp = {
            exists: true,
            size: testStats.size,
          }
          debugInfo.steps.push("✅ Test WEBP file created successfully")

          // Clean up test files
          await fs.promises.unlink(testStarPath)
          await fs.promises.unlink(testOutputPath)
        } catch (error) {
          debugInfo.files.testWebp = { exists: false }
          debugInfo.steps.push("❌ Test WEBP file was not created")
        }
      } catch (error: any) {
        debugInfo.errors.push(`Test render failed: ${error.message}`)
        debugInfo.steps.push("❌ Test render failed")
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error: any) {
    debugInfo.errors.push(`Debug failed: ${error.message}`)
    return NextResponse.json(debugInfo, { status: 500 })
  }
}
