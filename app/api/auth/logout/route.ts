import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao encerrar sessão.';
    console.error('Server logout error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
