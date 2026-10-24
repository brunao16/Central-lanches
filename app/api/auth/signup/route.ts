import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  fullName: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const supabase = await createClient();

    // SEGURANÇA: Todo novo usuário é cadastrado como 'customer'.
    // Qualquer papel enviado pelo cliente é explicitamente ignorado.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // Garantir o insert inicial na tabela profiles caso a trigger do banco não esteja ativa
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'customer',
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      message: 'Cadastro realizado com sucesso.' 
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno ao processar cadastro.';
    console.error('Server signup error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
