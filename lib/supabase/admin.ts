import { SUPABASE_URL } from './url'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
