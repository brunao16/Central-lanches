import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vafnozlbgtrpgfvcmyig.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZm5vemxiZ3RycGdmdmNteWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDY0MzAsImV4cCI6MjEwODI4MjQzMH0.ZtSdgDtTtx4CYD2imicIJh5T7pqDW_XLBcuFtgMdyTo';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // O método setAll pode ser chamado em Server Components onde cookies são somente leitura.
          // Ignora caso seja chamado fora de Route Handlers ou Server Actions.
        }
      },
    },
  });
}
