import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Lazy initialization - só cria quando é de verdade usado no cliente
let supabaseInstance: ReturnType<typeof createClient> | null = null

const initSupabase = () => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Durante build/prerender sem env vars, retorna um placeholder
      // Em runtime no navegador, as variáveis estarão disponíveis
      console.warn(
        'Supabase not configured. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
      )
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// Export como getter para lazy initialization
export const supabase = new Proxy({} as any, {
  get: (_, prop) => {
    const instance = initSupabase()
    return (instance as any)[prop]
  },
})

export const supabaseClient = () => {
  return initSupabase()
}
