import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      TIDBYT_DEVICE_ID: process.env.TIDBYT_DEVICE_ID ? "✅ Set" : "❌ Missing",
      TIDBYT_API_TOKEN: process.env.TIDBYT_API_TOKEN ? "✅ Set" : "❌ Missing",
    },
    paths: {
      cwd: process.cwd(),
      tmpDir: "/tmp",
    },
    files: {},
    downloadInfo: {
      primaryUrl: "https://github.com/tidbyt/pixlet/releases/download/v0.34.0/pixlet_0.34.0_linux_amd64.tar.gz",
      fallbackUrls: [
        "https://github.com/tidbyt/pixlet/releases/download/v0.33.8/pixlet_0.33.8_linux_amd64.tar.gz",
        "https://github.com/tidbyt/pixlet/releases/download/v0.33.7/pixlet_0.33.7_linux_amd64.tar.gz",
      ],
      willDownloadTo: "/tmp/pixlet_binary",
    },
  }

  // Check /tmp directory contents
  try {
    const tmpContents = await fs.promises.readdir("/tmp")
    debugInfo.files["/tmp directory contents"] = tmpContents
  } catch (error) {
    debugInfo.files["/tmp directory"] = { error: "Could not read /tmp" }
  }

  // Check if pixlet binary exists in /tmp
  const pixletPath = path.join("/tmp", "pixlet_binary")
  try {
    const stats = await fs.promises.stat(pixletPath)
    debugInfo.files[pixletPath] = {
      exists: true,
      size: stats.size,
      executable: !!(stats.mode & Number.parseInt("111", 8)),
    }
  } catch (error) {
    debugInfo.files[pixletPath] = { exists: false, note: "Will be downloaded on first run" }
  }

  // Test network connectivity to the primary download URL
  try {
    const response = await fetch(debugInfo.downloadInfo.primaryUrl, { method: "HEAD" })
    debugInfo.downloadInfo.primaryUrlTest = {
      status: response.status,
      statusText: response.statusText,
      contentLength: response.headers.get("content-length"),
      contentType: response.headers.get("content-type"),
    }
  } catch (error: any) {
    debugInfo.downloadInfo.primaryUrlTest = { error: error.message }
  }

  return NextResponse.json(debugInfo, null, 2)
}
