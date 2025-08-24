import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    files: {} as any,
    processes: {} as any,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    },
  }

  // Check /tmp directory contents
  try {
    const tmpContents = await fs.promises.readdir("/tmp")
    debugInfo.files.tmpDirectory = {
      contents: tmpContents,
      count: tmpContents.length,
    }
  } catch (error: any) {
    debugInfo.files.tmpDirectory = { error: error.message }
  }

  // Check specific files
  const filesToCheck = [
    "/tmp/pixlet_binary",
    "/tmp/location.star",
    "/tmp/location.webp",
    "/tmp/simple.star",
    "/tmp/test.star",
  ]

  for (const filePath of filesToCheck) {
    try {
      const stats = await fs.promises.stat(filePath)
      debugInfo.files[path.basename(filePath)] = {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        executable: !!(stats.mode & Number.parseInt("111", 8)),
      }
    } catch (error: any) {
      debugInfo.files[path.basename(filePath)] = {
        exists: false,
        error: error.code,
      }
    }
  }

  // Check for pixlet processes
  try {
    const { stdout } = await execAsync("ps aux | grep pixlet || true", { timeout: 5000 })
    debugInfo.processes.pixlet = stdout.split("\n").filter((line) => line.includes("pixlet") && !line.includes("grep"))
  } catch (error: any) {
    debugInfo.processes.pixlet = { error: error.message }
  }

  // Test pixlet binary if it exists
  const pixletPath = path.join("/tmp", "pixlet_binary")
  try {
    await fs.promises.access(pixletPath, fs.constants.F_OK)
    try {
      const { stdout } = await execAsync(`${pixletPath} version`, { timeout: 10000 })
      debugInfo.files.pixlet_binary.version = stdout.trim()
      debugInfo.files.pixlet_binary.working = true
    } catch (versionError: any) {
      debugInfo.files.pixlet_binary.working = false
      debugInfo.files.pixlet_binary.versionError = versionError.message
    }
  } catch (error) {
    // File doesn't exist, already handled above
  }

  // Check disk space
  try {
    const { stdout } = await execAsync("df -h /tmp", { timeout: 5000 })
    debugInfo.files.diskSpace = stdout
  } catch (error: any) {
    debugInfo.files.diskSpace = { error: error.message }
  }

  return NextResponse.json(debugInfo, { status: 200 })
}
