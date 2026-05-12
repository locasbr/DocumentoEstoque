import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const getSupabaseClient = () => {
  // Só inicializa no cliente (navegador)
  if (typeof window === 'undefined') {
    return null
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not found')
      return null
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

// Proxy que sempre chama getSupabaseClient() em runtime
export const supabase = new Proxy({} as any, {
  get: (_, prop) => {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase client not initialized. Make sure environment variables are set.')
    }
    return (client as any)[prop]
  },
})
