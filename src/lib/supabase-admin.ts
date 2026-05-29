import { createClient } from '@supabase/supabase-js'

// Cliente ADMIN — só roda no servidor (API routes)
// Usa a service_role key que ignora RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)