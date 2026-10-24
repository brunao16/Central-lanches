import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  quantity: z.number().int().positive('Quantidade deve ser maior que zero'),
  notes: z.string().max(200, 'Observação muito longa').optional(),
});

const createOrderSchema = z.object({
  restaurantId: z.string().uuid('ID do restaurante inválido'),
  items: z.array(orderItemSchema).min(1, 'Adicione pelo menos 1 item ao pedido'),
  address: z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    phone: z.string().min(10, 'Telefone com DDD é obrigatório'),
    street: z.string().min(2, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(2, 'Bairro é obrigatório'),
    complement: z.string().optional(),
    reference: z.string().optional(),
  }),
  paymentMethod: z.enum(['pix', 'credit_card', 'cash_on_delivery']),
  changeForReais: z.string().optional(),
  customerNotes: z.string().max(300).optional(),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados do pedido inválidos.' },
        { status: 400 }
      );
    }

    const {
      restaurantId,
      items: clientItems,
      address,
      paymentMethod,
      changeForReais,
      customerNotes,
      couponCode,
    } = parsed.data;

    // 1. Validar Restaurante (Aprovado, Aberto e buscar taxas)
    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('id, name, is_open, status, delivery_fee_cents, min_order_cents, commission_rate_percent, asaas_account_id')
      .eq('id', restaurantId)
      .single();

    if (restErr || !restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
    }

    if (restaurant.status !== 'approved') {
      return NextResponse.json({ error: 'Este restaurante não está disponível para pedidos.' }, { status: 400 });
    }

    if (!restaurant.is_open) {
      return NextResponse.json({ error: 'Este restaurante está fechado no momento.' }, { status: 400 });
    }

    // 2. Buscar Produtos no banco para ignorar preços enviados pelo cliente
    const productIds = clientItems.map((i) => i.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price_cents, is_available, restaurant_id')
      .in('id', productIds)
      .eq('restaurant_id', restaurantId);

    if (prodErr || !dbProducts || dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'Alguns produtos selecionados não existem ou pertencem a outro restaurante.' }, { status: 400 });
    }

    // Mapear produtos e checar disponibilidade
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let subtotalCents = 0;
    const itemsToInsert = [];

    for (const clientItem of clientItems) {
      const product = productMap.get(clientItem.productId);
      if (!product) {
        return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
      }

      if (!product.is_available) {
        return NextResponse.json({ error: `O produto "${product.name}" não está disponível no momento.` }, { status: 400 });
      }

      const itemTotalCents = product.price_cents * clientItem.quantity;
      subtotalCents += itemTotalCents;

      itemsToInsert.push({
        product_id: product.id,
        product_name: product.name,
        unit_price_cents: product.price_cents,
        quantity: clientItem.quantity,
        total_price_cents: itemTotalCents,
        notes: clientItem.notes || null,
      });
    }

    // 3. Validar Pedido Mínimo
    if (subtotalCents < (restaurant.min_order_cents || 0)) {
      const minReais = ((restaurant.min_order_cents || 0) / 100).toFixed(2).replace('.', ',');
      return NextResponse.json(
        { error: `O valor mínimo para entrega neste restaurante é de R$ ${minReais}.` },
        { status: 400 }
      );
    }

    // 4. Validar Cupom de Desconto no Banco
    let discountCents = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('active', true)
        .single();

      if (coupon) {
        const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const meetsMinimum = subtotalCents >= (coupon.min_order_cents || 0);
        const withinUsageLimit = !coupon.usage_limit || coupon.times_used < coupon.usage_limit;

        if (isNotExpired && meetsMinimum && withinUsageLimit) {
          couponId = coupon.id;
          if (coupon.discount_type === 'percentage') {
            discountCents = Math.round((subtotalCents * coupon.discount_value) / 100);
            if (coupon.max_discount_cents && discountCents > coupon.max_discount_cents) {
              discountCents = coupon.max_discount_cents;
            }
          } else {
            discountCents = coupon.discount_value;
          }
          // Nunca deixa desconto ser maior que o subtotal
          if (discountCents > subtotalCents) {
            discountCents = subtotalCents;
          }
        }
      }
    }

    // 5. Cálculos Financeiros Rigorosos (Comissão baseada no commission_rate_percent do restaurante)
    const deliveryFeeCents = restaurant.delivery_fee_cents || 0;
    const totalCents = subtotalCents - discountCents + deliveryFeeCents;

    const commissionPercent = Number(restaurant.commission_rate_percent) || 10.0;
    const platformFeeCents = Math.round((subtotalCents * commissionPercent) / 100);
    const restaurantNetCents = subtotalCents - platformFeeCents;

    // Tratar troco
    let changeForCents: number | null = null;
    if (paymentMethod === 'cash_on_delivery' && changeForReais) {
      const parsedReais = parseFloat(changeForReais.replace(',', '.'));
      if (!isNaN(parsedReais)) {
        changeForCents = Math.round(parsedReais * 100);
      }
    }

    // 6. Gravação Atômica via RPC no PostgreSQL
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
      p_customer_id: user?.id || null,
      p_restaurant_id: restaurant.id,
      p_delivery_address: address,
      p_subtotal_cents: subtotalCents,
      p_delivery_fee_cents: deliveryFeeCents,
      p_discount_cents: discountCents,
      p_total_cents: totalCents,
      p_platform_fee_cents: platformFeeCents,
      p_restaurant_net_cents: restaurantNetCents,
      p_payment_method: paymentMethod,
      p_payment_status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      p_change_for_cents: changeForCents,
      p_customer_notes: customerNotes || '',
      p_coupon_id: couponId,
      p_items: itemsToInsert,
    });

    if (rpcErr || !rpcResult?.order_id) {
      // Fallback para insert comum caso a RPC ainda não tenha sido executada no banco
      const { data: directOrder, error: directErr } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user?.id || null,
            restaurant_id: restaurant.id,
            delivery_address: address,
            subtotal_cents: subtotalCents,
            delivery_fee_cents: deliveryFeeCents,
            discount_cents: discountCents,
            total_cents: totalCents,
            platform_fee_cents: platformFeeCents,
            restaurant_net_cents: restaurantNetCents,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: 'pending',
            change_for_cents: changeForCents,
            customer_notes: customerNotes || '',
          },
        ])
        .select()
        .single();

      if (directErr) {
        return NextResponse.json({ error: 'Erro ao criar o pedido no banco de dados: ' + directErr.message }, { status: 500 });
      }

      // Inserir itens
      const orderItems = itemsToInsert.map((item) => ({
        ...item,
        order_id: directOrder.id,
      }));
      await supabase.from('order_items').insert(orderItems);

      return NextResponse.json({
        success: true,
        orderId: directOrder.id,
        totalCents,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: rpcResult.order_id,
      totalCents,
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno ao processar pedido.';
    console.error('Server order creation error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
