import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET() {
  try {
    // Check if the webp file exists in /tmp
    const webpPath = path.join("/tmp", "location.webp")

    try {
      const imageBuffer = await fs.promises.readFile(webpPath)

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
          "Content-Disposition": "inline; filename=tidbyt-display.webp",
        },
      })
    } catch (error) {
      // If no image exists, return a placeholder message
      return new NextResponse("No Tidbyt image available yet. Trigger an update first.", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }
  } catch (error: any) {
    console.error("Error serving Tidbyt image:", error)
    return new NextResponse("Error retrieving image", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })
  }
}
