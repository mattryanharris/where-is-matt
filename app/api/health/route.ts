export const runtime = "edge"

import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    status: "unknown",
    checks: {
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      database: {
        connected: false,
        error: null as string | null,
      },
    },
  }

  // Check environment variables
  if (!health.checks.environment.supabaseUrl || !health.checks.environment.supabaseKey) {
    health.status = "error"
    health.checks.database.error = "Missing Supabase environment variables"
    return Response.json(health, { status: 500 })
  }

  // Test database connection
  try {
    const supabase = createServerClient()

    // Try a simple query to test the connection
    const { data, error } = await supabase.from("locations").select("count").limit(1)

    if (error) {
      health.checks.database.error = error.message
      health.status = "error"
    } else {
      health.checks.database.connected = true
      health.status = "healthy"
    }
  } catch (error: any) {
    health.checks.database.error = error.message
    health.status = "error"
  }

  const statusCode = health.status === "healthy" ? 200 : 500
  return Response.json(health, { status: statusCode })
}
