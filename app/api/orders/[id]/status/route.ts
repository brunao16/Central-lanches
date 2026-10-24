import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'canceled']),
  cancellationReason: z.string().max(200).optional(),
});

export async function PATCH(
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
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Status inválido.' },
        { status: 400 }
      );
    }

    const { status: targetStatus, cancellationReason } = parsed.data;

    // Buscar pedido atual
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, restaurant_id, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    // Buscar perfil do usuário para saber seu papel
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Se for restaurante, verificar se ele é dono deste restaurante
    if (role === 'restaurant_owner') {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', order.restaurant_id)
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) {
        return NextResponse.json({ error: 'Você não tem permissão para alterar este pedido.' }, { status: 403 });
      }

      // Máquina de estados para restaurante:
      // pending -> confirmed | preparing | canceled
      // confirmed -> preparing | canceled
      // preparing -> out_for_delivery | canceled
      // out_for_delivery -> delivered
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'preparing', 'canceled'],
        confirmed: ['preparing', 'canceled'],
        preparing: ['out_for_delivery', 'delivered', 'canceled'],
        out_for_delivery: ['delivered'],
        delivered: [],
        canceled: [],
      };

      if (!validTransitions[order.status]?.includes(targetStatus)) {
        return NextResponse.json(
          { error: `Transição de "${order.status}" para "${targetStatus}" não permitida.` },
          { status: 400 }
        );
      }
    } else if (role === 'courier') {
      // Entregador pode aceitar e colocar em out_for_delivery ou delivered
      if (!['out_for_delivery', 'delivered'].includes(targetStatus)) {
        return NextResponse.json({ error: 'Entregador só pode atualizar para em rota ou entregue.' }, { status: 403 });
      }
    } else if (role === 'admin') {
      // Admin tem passe livre
    } else {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    // Atualizar pedido
    const updatePayload: Record<string, unknown> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === 'canceled' && cancellationReason) {
      updatePayload.cancellation_reason = cancellationReason;
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: targetStatus });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar status.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
