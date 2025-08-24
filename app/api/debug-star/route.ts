import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    starFile: null as any,
    webpFile: null as any,
    message: null as any,
  }

  try {
    // Check if star file exists and read its content
    const starPath = path.join("/tmp", "location.star")
    try {
      const starContent = await fs.promises.readFile(starPath, "utf8")
      const stats = await fs.promises.stat(starPath)
      debugInfo.starFile = {
        exists: true,
        path: starPath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        content: starContent,
      }
    } catch (error) {
      debugInfo.starFile = {
        exists: false,
        path: starPath,
        error: "File not found - trigger an update first",
      }
    }

    // Check webp file
    const webpPath = path.join("/tmp", "location.webp")
    try {
      const stats = await fs.promises.stat(webpPath)
      debugInfo.webpFile = {
        exists: true,
        path: webpPath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        publicUrl: "/api/tidbyt-image",
      }
    } catch (error) {
      debugInfo.webpFile = {
        exists: false,
        path: webpPath,
        error: "File not found - trigger an update first",
      }
    }

    // Get current message data
    try {
      const apiUrl = "https://v0-vercel-edge-api-route.vercel.app/api/message"
      const response = await fetch(apiUrl)
      if (response.ok) {
        debugInfo.message = await response.json()
      }
    } catch (error) {
      debugInfo.message = { error: "Could not fetch message" }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        ...debugInfo,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
