-- ==============================================================================
-- MIGRAÇÃO 03: TABELA DE CUPONS E RPC DE CRIAÇÃO ATÔMICA DE PEDIDO
-- ==============================================================================

-- 1. TABELA DE CUPONS (coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL, -- Porcentagem (ex: 10 para 10%) ou centavos (ex: 500 para R$ 5,00)
    min_order_cents INTEGER DEFAULT 0,
    max_discount_cents INTEGER,
    usage_limit INTEGER, -- Limite total de usos (NULL = ilimitado)
    times_used INTEGER DEFAULT 0,
    first_order_only BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Leitura pública de cupons ativos
CREATE POLICY "Leitura pública de cupons ativos"
ON public.coupons FOR SELECT
USING (active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admin gerencia cupons"
ON public.coupons FOR ALL
USING (public.is_admin());

-- Inserir cupons padrão
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_cents, first_order_only)
VALUES 
    ('BEMVINDO10', 'percentage', 10, 2000, true),
    ('UAI5', 'fixed', 500, 2500, false)
ON CONFLICT (code) DO NOTHING;

-- 2. FUNÇÃO RPC PARA CRIAÇÃO ATÔMICA DE PEDIDO (GARANTE TRANSAÇÃO E SEGURANÇA NO BANCO)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_customer_id UUID,
    p_restaurant_id UUID,
    p_delivery_address JSONB,
    p_subtotal_cents INTEGER,
    p_delivery_fee_cents INTEGER,
    p_discount_cents INTEGER,
    p_total_cents INTEGER,
    p_platform_fee_cents INTEGER,
    p_restaurant_net_cents INTEGER,
    p_payment_method VARCHAR(20),
    p_payment_status VARCHAR(20),
    p_change_for_cents INTEGER,
    p_customer_notes TEXT,
    p_coupon_id UUID,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
BEGIN
    -- 1. Inserir o pedido
    INSERT INTO public.orders (
        customer_id,
        restaurant_id,
        delivery_address,
        subtotal_cents,
        delivery_fee_cents,
        discount_cents,
        total_cents,
        platform_fee_cents,
        restaurant_net_cents,
        status,
        payment_method,
        payment_status,
        change_for_cents,
        customer_notes
    ) VALUES (
        p_customer_id,
        p_restaurant_id,
        p_delivery_address,
        p_subtotal_cents,
        p_delivery_fee_cents,
        p_discount_cents,
        p_total_cents,
        p_platform_fee_cents,
        p_restaurant_net_cents,
        'pending',
        p_payment_method,
        p_payment_status,
        p_change_for_cents,
        p_customer_notes
    ) RETURNING id INTO v_order_id;

    -- 2. Inserir cada item
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        product_name VARCHAR(150),
        unit_price_cents INTEGER,
        quantity INTEGER,
        total_price_cents INTEGER,
        notes TEXT
    ) LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            unit_price_cents,
            quantity,
            total_price_cents,
            notes
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_item.product_name,
            v_item.unit_price_cents,
            v_item.quantity,
            v_item.total_price_cents,
            v_item.notes
        );
    END LOOP;

    -- 3. Atualizar uso do cupom se aplicável
    IF p_coupon_id IS NOT NULL THEN
        UPDATE public.coupons 
        SET times_used = times_used + 1 
        WHERE id = p_coupon_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
