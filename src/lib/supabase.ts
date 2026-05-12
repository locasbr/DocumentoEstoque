import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    } else {
      // Retorna um client dummy durante build (não será usado)
      supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key')
    }
  }
  return supabaseInstance
}

// Export como um proxy que chama getSupabaseClient()
export const supabase = new Proxy({} as any, {
  get: (_, prop) => {
    const client = getSupabaseClient()
    return (client as any)[prop]
  },
})
