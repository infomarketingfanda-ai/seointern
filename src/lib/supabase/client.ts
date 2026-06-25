'use client'
import { createBrowserClient } from '@supabase/ssr'

// Public values safe to embed in client bundle
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ltmeibvrnaxttensqpth.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWVpYnZybmF4dHRlbnNxcHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzEzMjEsImV4cCI6MjA2NjQ0NzMyMX0.mwMVT__lBTbBLYPXhVMx9Wuq3sNfcJvyMJXfDrKOUbc'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
