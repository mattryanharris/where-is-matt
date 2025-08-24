import { NextResponse } from "next/server"
import fs from "fs"

export async function POST() {
  const result: any = {
    timestamp: new Date().toISOString(),
    cleaned: [],
    errors: [],
  }

  // Files to clean up
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
      result.cleaned.push(file)
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        // Ignore "file not found" errors
        result.errors.push(`${file}: ${error.message}`)
      }
    }
  }

  return NextResponse.json({
    ...result,
    message: `Cleaned up ${result.cleaned.length} files`,
    success: result.errors.length === 0,
  })
}
