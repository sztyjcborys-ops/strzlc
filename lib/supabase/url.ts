// The env value may be pasted as the REST endpoint (".../rest/v1/"); supabase-js needs the project base URL.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1$/, '')
