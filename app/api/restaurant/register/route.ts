import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const restaurantRegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  slug: z.string().min(2, 'Slug inválido'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  description: z.string().optional(),
  street: z.string().min(2, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().default('Passos'),
  state: z.string().default('MG'),
  deliveryFeeCents: z.number().int().nonnegative().default(500),
  deliveryTimeMin: z.number().int().positive().default(30),
  deliveryTimeMax: z.number().int().positive().default(50),
  minOrderCents: z.number().int().nonnegative().default(2000),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = restaurantRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // 1. Inserir o restaurante
    const { data: restData, error: restErr } = await supabase
      .from('restaurants')
      .insert([
        {
          owner_id: user.id,
          name: d.name,
          slug: d.slug,
          cnpj: d.cnpj,
          phone: d.phone,
          description: d.description || '',
          address_street: d.street,
          address_number: d.number,
          address_neighborhood: d.neighborhood,
          address_city: d.city,
          address_state: d.state,
          delivery_fee_cents: d.deliveryFeeCents,
          delivery_time_min: d.deliveryTimeMin,
          delivery_time_max: d.deliveryTimeMax,
          min_order_cents: d.minOrderCents,
          commission_rate_percent: 10.00,
          status: 'pending', // aguarda aprovação por padrão
          is_open: true,
        },
      ])
      .select()
      .single();

    if (restErr) {
      return NextResponse.json({ error: restErr.message }, { status: 400 });
    }

    // 2. SEGURANÇA: Promover o usuário a restaurant_owner no servidor com Service Role
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from('profiles')
        .update({ role: 'restaurant_owner' })
        .eq('id', user.id);
    } catch {
      // Fallback para update via RLS caso service role não esteja configurado localmente
      await supabase
        .from('profiles')
        .update({ role: 'restaurant_owner' })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      restaurant: restData,
      message: 'Restaurante cadastrado com sucesso!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao processar cadastro de restaurante.';
    console.error('Restaurant register error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
