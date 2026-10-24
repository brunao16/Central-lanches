import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateAsaasCustomer, createAsaasPixPayment } from '@/lib/asaas';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    // 1. Buscar detalhes do pedido
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, restaurants(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // SEGURANÇA: Verificar se o pedido pertence ao usuário autenticado (se logado)
    if (user && order.customer_id && order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado a este pedido.' }, { status: 403 });
    }

    // Validar método de pagamento
    if (order.payment_method !== 'pix') {
      return NextResponse.json({ error: 'Este pedido não utiliza pagamento via Pix.' }, { status: 400 });
    }

    // 2. Criar ou obter cliente no Asaas
    const customer = await getOrCreateAsaasCustomer({
      name: order.delivery_address?.name || 'Cliente UaiFood',
      phone: order.delivery_address?.phone,
    });

    // 3. Criar cobrança Pix no Asaas
    const valueReais = order.total_cents / 100;
    const platformFeeReais = order.platform_fee_cents / 100;

    const payment = await createAsaasPixPayment({
      customerId: customer.id,
      valueReais,
      description: `Pedido #${order.order_number || order.id.slice(0, 6)} - ${order.restaurants?.name}`,
      externalReference: order.id,
      restaurantWalletId: order.restaurants?.asaas_account_id,
      platformFeeReais,
    });

    // 4. Atualizar pedido com ID de pagamento Asaas
    if (payment?.id) {
      await supabase
        .from('orders')
        .update({ asaas_payment_id: payment.id })
        .eq('id', order.id);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      pix: payment.pix || null,
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar pagamento Pix';
    console.error('API /api/asaas/payment error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
