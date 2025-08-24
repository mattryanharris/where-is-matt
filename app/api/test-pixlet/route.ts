import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function POST() {
  const result: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
  }

  try {
    // Step 1: Check for pixlet binary
    const pixletPath = path.join("/tmp", "pixlet_binary")
    try {
      await fs.promises.access(pixletPath, fs.constants.F_OK)
      result.steps.push("✅ Pixlet binary found")
    } catch (error) {
      result.steps.push("❌ Pixlet binary not found")
      return NextResponse.json(result, { status: 400 })
    }

    // Step 2: Create the simplest possible star file
    const starPath = path.join("/tmp", "simple.star")
    const starContent = `load("render.star", "render")

def main(ctx):
    return render.Root(
        child = render.Text(
            content = "Hello World",
            font = "6x13",
            color = "#fff",
        ),
    )
`

    await fs.promises.writeFile(starPath, starContent)
    result.steps.push("✅ Created simple.star file")
    result.starContent = starContent

    // Step 3: Test pixlet version first
    try {
      const { stdout: versionOut } = await execAsync(`${pixletPath} version`, { timeout: 10000 })
      result.pixletVersion = versionOut.trim()
      result.steps.push(`✅ Pixlet version: ${versionOut.trim()}`)
    } catch (error: any) {
      result.steps.push(`⚠️ Could not get pixlet version: ${error.message}`)
    }

    // Step 4: Try to render the simple file
    const outputPath = path.join("/tmp", "simple.webp")
    const renderCommand = `${pixletPath} render ${starPath} -o ${outputPath}`

    result.steps.push(`🔄 Executing: ${renderCommand}`)

    const { stdout, stderr } = await execAsync(renderCommand, { timeout: 30000 })

    result.renderOutput = { stdout, stderr }

    if (stderr) {
      result.steps.push(`⚠️ Render stderr: ${stderr}`)
    }

    if (stdout) {
      result.steps.push(`📝 Render stdout: ${stdout}`)
    }

    // Step 5: Check if file was created
    try {
      const stats = await fs.promises.stat(outputPath)
      result.generatedFile = {
        path: outputPath,
        size: stats.size,
        created: stats.mtime.toISOString(),
      }
      result.steps.push(`✅ Simple WEBP file created successfully (${stats.size} bytes)`)
      result.success = true

      // Clean up
      await fs.promises.unlink(starPath)
      await fs.promises.unlink(outputPath)
    } catch (error: any) {
      result.steps.push(`❌ Simple WEBP file was not created: ${error.message}`)
      result.success = false
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error: any) {
    result.steps.push(`❌ Error: ${error.message}`)
    result.error = error.message
    return NextResponse.json(result, { status: 500 })
  }
}
