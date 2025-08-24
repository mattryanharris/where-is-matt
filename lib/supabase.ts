import { createClient } from "@supabase/supabase-js"

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables:")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Set" : "❌ Missing")
}

// Singleton pattern for client-side Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

// Server-side Supabase client
export function createServerClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}
