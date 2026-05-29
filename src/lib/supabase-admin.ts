import { createClient, SupabaseClient } from '@supabase/supabase-js'

let instance: SupabaseClient | null = null

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    if (!instance) {
      instance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    return (instance as any)[prop]
  },
})