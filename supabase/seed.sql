-- ==============================================================================
-- DADOS INICIAIS (SEED) PARA HOMOLOGAÇÃO E PRODUÇÃO
-- ==============================================================================

-- 1. Inserir Cidade Oficial (Passos - MG)
INSERT INTO public.cities (id, name, state, slug, active)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'Passos',
    'MG',
    'passos-mg',
    true
) ON CONFLICT (slug) DO NOTHING;

-- 2. Inserir Categorias Oficiais de Restaurante
INSERT INTO public.restaurant_categories (id, name, icon)
VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'Lanches', 'UtensilsCrossed'),
    ('f0000000-0000-0000-0000-000000000002', 'Pizzas', 'Flame'),
    ('f0000000-0000-0000-0000-000000000003', 'Porções', 'Store'),
    ('f0000000-0000-0000-0000-000000000004', 'Almoço & Marmitex', 'Clock'),
    ('f0000000-0000-0000-0000-000000000005', 'Açaí & Sobremesas', 'Star'),
    ('f0000000-0000-0000-0000-000000000006', 'Bebidas', 'ShoppingBag')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Cupons da Plataforma
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_cents, first_order_only)
VALUES 
    ('BEMVINDO10', 'percentage', 10, 2000, true),
    ('UAI5', 'fixed', 500, 2500, false)
ON CONFLICT (code) DO NOTHING;
