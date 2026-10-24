import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAsaasPaymentStatus } from '@/lib/asaas';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // 1. Validar Token do Webhook do Asaas (comparação em tempo constante)
    const expectedToken = process.env.ASAAS_WEBHOOK_ACCESS_TOKEN;
    const receivedToken = req.headers.get('asaas-access-token');

    if (expectedToken) {
      if (!receivedToken) {
        return NextResponse.json({ error: 'Token de autenticação do webhook ausente' }, { status: 401 });
      }

      const expectedBuffer = Buffer.from(expectedToken);
      const receivedBuffer = Buffer.from(receivedToken);

      if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        return NextResponse.json({ error: 'Token de webhook inválido' }, { status: 401 });
      }
    }

    const payload = await req.json();
    const { event, payment } = payload;

    if (!payment?.id || !payment?.externalReference) {
      return NextResponse.json({ error: 'Payload incompleto' }, { status: 400 });
    }

    const orderId = payment.externalReference;
    const paymentId = payment.id;

    const supabase = createAdminClient();

    // 2. Buscar o pedido para idempotência
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, payment_status, status, total_cents')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não localizado' }, { status: 404 });
    }

    // 3. Tratar eventos com Idempotência
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      // Se já foi processado como pago anteriormente, ignora para evitar duplicações
      if (order.payment_status === 'paid') {
        return NextResponse.json({ received: true, already_processed: true });
      }

      // Validar valor e externalReference consultando diretamente na API do Asaas
      if (process.env.ASAAS_API_KEY) {
        const verifiedPayment = await getAsaasPaymentStatus(paymentId);
        if (
          !verifiedPayment ||
          verifiedPayment.externalReference !== orderId ||
          Math.round(verifiedPayment.value * 100) !== order.total_cents
        ) {
          console.error('Divergência detectada entre webhook e API Asaas:', {
            orderId,
            verifiedPayment,
          });
          return NextResponse.json({ error: 'Divergência de valores ou referência' }, { status: 400 });
        }
      }

      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          asaas_payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    } else if (event === 'PAYMENT_OVERDUE') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    } else if (event === 'PAYMENT_REFUNDED') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: 'canceled',
          cancel_reason: 'Pagamento estornado via Asaas',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    } else if (event === 'PAYMENT_DELETED') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'canceled',
          cancel_reason: 'Cobrança cancelada no gateway',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno no processamento do webhook.';
    console.error('Webhook Asaas error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
