import { createClient } from '@supabase/supabase-js'

// Cliente para uso no servidor (MCP, rotas de API) - acesso total, ignora RLS
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Cliente para uso no front-end (CRM/Dashboard) - respeita RLS
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}