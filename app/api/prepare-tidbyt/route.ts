import fs from "fs"
import path from "path"

async function createStarFile(): Promise<string> {
  const starfilePath = path.join("/tmp", "location.star")

  // Get the message and train info directly here instead of using HTTP in the star file
  let message = "Unavailable"
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
  } catch (error) {
    console.log("Failed to fetch message, using default")
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

  try {
    await fs.promises.writeFile(starfilePath, starContent)
    console.log(`Created .star file at: ${starfilePath}`)
    console.log(`Message content: "${message}"`)
    if (trainDetails) {
      console.log(`Train details: "${trainDetails}"`)
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

export default createStarFile
