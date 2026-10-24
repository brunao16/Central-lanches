import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().min(3, 'Informe o motivo do cancelamento').max(200, 'Motivo muito longo'),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido obrigatório.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para cancelar o pedido.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = cancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Motivo inválido.' },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    // Buscar pedido
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, customer_id, restaurant_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    // Verificar se o pedido pertence a este usuário
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Você só pode cancelar seus próprios pedidos.' }, { status: 403 });
    }

    // Regra de negócio: cliente só pode cancelar se ainda estiver em 'pending'
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'O pedido já foi aceito ou está em preparo pela cozinha e não pode ser cancelado diretamente. Entre em contato com o restaurante pelo WhatsApp.' },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'canceled',
        cancellation_reason: `Cancelado pelo cliente: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pedido cancelado com sucesso.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao cancelar pedido.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
