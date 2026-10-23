import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { event, payment } = payload;

    // Se o pagamento foi confirmado pelo Asaas (Pix ou Cartão)
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const orderId = payment.externalReference;
      const asaasPaymentId = payment.id;

      if (orderId) {
        // Atualizar status do pedido para 'confirmed' e payment_status para 'paid'
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook Asaas error:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
