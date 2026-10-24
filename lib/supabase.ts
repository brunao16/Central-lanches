import { createClient } from '@supabase/supabase-js';

// URL e Chave Pública Anon do Supabase com fallback direto integrado
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://vafnozlbgtrpgfvcmyig.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZm5vemxiZ3RycGdmdmNteWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDY0MzAsImV4cCI6MjEwODI4MjQzMH0.ZtSdgDtTtx4CYD2imicIJh5T7pqDW_XLBcuFtgMdyTo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
