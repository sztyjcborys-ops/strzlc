import { SUPABASE_URL } from './url'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookieOptions: { secure: process.env.NODE_ENV === 'production' } },
    )
  }
  return client
}
