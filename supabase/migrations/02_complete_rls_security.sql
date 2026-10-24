-- ==============================================================================
-- MIGRAÇÃO 02: ROW LEVEL SECURITY (RLS) COMPLETA EM TODAS AS TABELAS
-- ==============================================================================

-- 1. FUNÇÃO AUXILIAR PARA CHECAGEM DE ADMIN (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HABILITAR RLS EM TODAS AS TABELAS DO SCHEMA
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLICIES ANTIGAS (SE EXISTIREM) PARA EVITAR CONFLITOS
DROP POLICY IF EXISTS "Cidades ativas públicas" ON public.cities;
DROP POLICY IF EXISTS "Categorias de restaurantes públicas" ON public.restaurant_categories;
DROP POLICY IF EXISTS "Perfis públicos para leitura própria" ON public.profiles;
DROP POLICY IF EXISTS "Perfis editáveis pelo próprio usuário" ON public.profiles;
DROP POLICY IF EXISTS "Admin gerencia perfis" ON public.profiles;
DROP POLICY IF EXISTS "Restaurantes aprovados visíveis para todos" ON public.restaurants;
DROP POLICY IF EXISTS "Donos gerenciam seu próprio restaurante" ON public.restaurants;
DROP POLICY IF EXISTS "Admin gerencia todos os restaurantes" ON public.restaurants;
DROP POLICY IF EXISTS "Horários públicos de restaurantes aprovados" ON public.operating_hours;
DROP POLICY IF EXISTS "Donos gerenciam horários de funcionamento" ON public.operating_hours;
DROP POLICY IF EXISTS "Categorias de cardápio públicas de restaurantes aprovados" ON public.menu_categories;
DROP POLICY IF EXISTS "Donos gerenciam categorias de cardápio" ON public.menu_categories;
DROP POLICY IF EXISTS "Produtos públicos de restaurantes aprovados" ON public.products;
DROP POLICY IF EXISTS "Donos gerenciam produtos" ON public.products;
DROP POLICY IF EXISTS "Grupos de opcionais públicos" ON public.product_option_groups;
DROP POLICY IF EXISTS "Donos gerenciam grupos de opcionais" ON public.product_option_groups;
DROP POLICY IF EXISTS "Itens de opcionais públicos" ON public.product_option_items;
DROP POLICY IF EXISTS "Donos gerenciam itens de opcionais" ON public.product_option_items;
DROP POLICY IF EXISTS "Clientes gerenciam seus próprios endereços" ON public.customer_addresses;
DROP POLICY IF EXISTS "Clientes visualizam seus próprios pedidos" ON public.orders;
DROP POLICY IF EXISTS "Donos visualizam pedidos de seus restaurantes" ON public.orders;
DROP POLICY IF EXISTS "Donos atualizam status de pedidos de seus restaurantes" ON public.orders;
DROP POLICY IF EXISTS "Admin gerencia todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "Clientes visualizam itens de seus pedidos" ON public.order_items;
DROP POLICY IF EXISTS "Donos visualizam itens de pedidos de seus restaurantes" ON public.order_items;

-- 4. POLICIES: CIDADES (cities)
CREATE POLICY "Cidades ativas públicas"
ON public.cities FOR SELECT
USING (active = true OR public.is_admin());

CREATE POLICY "Admin gerencia cidades"
ON public.cities FOR ALL
USING (public.is_admin());

-- 5. POLICIES: CATEGORIAS DE RESTAURANTE (restaurant_categories)
CREATE POLICY "Categorias de restaurantes públicas"
ON public.restaurant_categories FOR SELECT
USING (true);

CREATE POLICY "Admin gerencia categorias de restaurante"
ON public.restaurant_categories FOR ALL
USING (public.is_admin());

-- 6. POLICIES: PERFIS (profiles)
CREATE POLICY "Perfis públicos para leitura própria"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Perfis editáveis pelo próprio usuário"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    -- Impede auto-promoção a admin via UPDATE direto pelo usuário
    AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
);

CREATE POLICY "Admin gerencia perfis"
ON public.profiles FOR ALL
USING (public.is_admin());

-- 7. POLICIES: RESTAURANTES (restaurants)
CREATE POLICY "Restaurantes aprovados visíveis para todos"
ON public.restaurants FOR SELECT
USING (status = 'approved' OR auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Donos inserem seu próprio restaurante"
ON public.restaurants FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Donos atualizam seu próprio restaurante"
ON public.restaurants FOR UPDATE
USING (auth.uid() = owner_id OR public.is_admin())
WITH CHECK (
    auth.uid() = owner_id 
    -- Impede o dono de alterar a comissão ou se auto-aprovar
    AND (
        commission_rate_percent = (SELECT commission_rate_percent FROM public.restaurants WHERE id = id)
        AND (status = (SELECT status FROM public.restaurants WHERE id = id) OR public.is_admin())
    )
    OR public.is_admin()
);

CREATE POLICY "Admin gerencia todos os restaurantes"
ON public.restaurants FOR ALL
USING (public.is_admin());

-- 8. POLICIES: HORÁRIOS DE FUNCIONAMENTO (operating_hours)
CREATE POLICY "Horários públicos de restaurantes aprovados"
ON public.operating_hours FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = operating_hours.restaurant_id AND (r.status = 'approved' OR r.owner_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Donos gerenciam horários de funcionamento"
ON public.operating_hours FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = operating_hours.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

-- 9. POLICIES: CATEGORIAS DO CARDÁPIO (menu_categories)
CREATE POLICY "Categorias de cardápio públicas de restaurantes aprovados"
ON public.menu_categories FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = menu_categories.restaurant_id AND (r.status = 'approved' OR r.owner_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Donos gerenciam categorias de cardápio"
ON public.menu_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = menu_categories.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

-- 10. POLICIES: PRODUTOS (products)
CREATE POLICY "Produtos públicos de restaurantes aprovados"
ON public.products FOR SELECT
USING (
    (is_available = true AND EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = products.restaurant_id AND r.status = 'approved'
    ))
    OR EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = products.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Donos gerenciam produtos"
ON public.products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = products.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

-- 11. POLICIES: GRUPOS E ITENS DE OPCIONAIS (product_option_groups e product_option_items)
CREATE POLICY "Grupos de opcionais públicos"
ON public.product_option_groups FOR SELECT
USING (true);

CREATE POLICY "Donos gerenciam grupos de opcionais"
ON public.product_option_groups FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.restaurants r ON r.id = p.restaurant_id
        WHERE p.id = product_option_groups.product_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Itens de opcionais públicos"
ON public.product_option_items FOR SELECT
USING (true);

CREATE POLICY "Donos gerenciam itens de opcionais"
ON public.product_option_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.product_option_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.restaurants r ON r.id = p.restaurant_id
        WHERE g.id = product_option_items.group_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

-- 12. POLICIES: ENDEREÇOS (customer_addresses)
CREATE POLICY "Clientes gerenciam seus próprios endereços"
ON public.customer_addresses FOR ALL
USING (auth.uid() = customer_id OR public.is_admin());

-- 13. POLICIES: PEDIDOS (orders)
CREATE POLICY "Clientes visualizam seus próprios pedidos"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Donos visualizam pedidos de seus restaurantes"
ON public.orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = orders.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Donos atualizam status de pedidos de seus restaurantes"
ON public.orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = orders.restaurant_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
)
WITH CHECK (
    -- Permite alterar apenas status e cancel_reason, bloqueando adulteração de valores ou pagamento
    payment_status = (SELECT payment_status FROM public.orders WHERE id = id)
    AND subtotal_cents = (SELECT subtotal_cents FROM public.orders WHERE id = id)
    AND platform_fee_cents = (SELECT platform_fee_cents FROM public.orders WHERE id = id)
    OR public.is_admin()
);

CREATE POLICY "Admin gerencia todos os pedidos"
ON public.orders FOR ALL
USING (public.is_admin());

-- 14. POLICIES: ITENS DO PEDIDO (order_items)
CREATE POLICY "Clientes visualizam itens de seus pedidos"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id AND (o.customer_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Donos visualizam itens de pedidos de seus restaurantes"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.restaurants r ON r.id = o.restaurant_id
        WHERE o.id = order_items.order_id AND (r.owner_id = auth.uid() OR public.is_admin())
    )
);
