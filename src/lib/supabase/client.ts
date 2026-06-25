'use client'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ltmeibvrnaxttensqpth.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWVpYnZybmF4dHRlbnNxcHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDAzMzUsImV4cCI6MjA5Nzk3NjMzNX0.ykTMT-ihXZOEda_Q-qkaKK9x-T8P1xA_T6-ABuKOUbc'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
