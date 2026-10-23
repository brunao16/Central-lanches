-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS - CENTRAL LANCHES (MARKETPLACE DE DELIVERY)
-- Execute este script no SQL Editor do Supabase para criar as tabelas
-- ==============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CIDADES ATENDIDAS
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PERFIS DE USUÁRIO (Extensão da tabela auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'restaurant_owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CATEGORIAS DE RESTAURANTES (Hambúrguer, Pizza, Açaí, Marmitex, etc.)
CREATE TABLE IF NOT EXISTS public.restaurant_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(60) NOT NULL,
    icon VARCHAR(60), -- Nome do ícone Lucide ou URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RESTAURANTES
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    city_id UUID REFERENCES public.cities(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.restaurant_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    sanitary_license_url TEXT,
    address_street VARCHAR(200) NOT NULL,
    address_number VARCHAR(20) NOT NULL,
    address_neighborhood VARCHAR(100) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(2) NOT NULL,
    address_zip VARCHAR(10),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    delivery_fee_type VARCHAR(20) DEFAULT 'fixed' CHECK (delivery_fee_type IN ('fixed', 'neighborhood', 'radius')),
    delivery_fee_cents INTEGER DEFAULT 500, -- R$ 5,00 por padrão
    delivery_time_min INTEGER DEFAULT 30,
    delivery_time_max INTEGER DEFAULT 50,
    min_order_cents INTEGER DEFAULT 2000, -- R$ 20,00 por padrão
    commission_rate_percent NUMERIC(5, 2) DEFAULT 10.00, -- Comissão da plataforma (10% padrão)
    asaas_account_id VARCHAR(100), -- ID da subconta no Asaas para split
    is_open BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HORÁRIOS DE FUNCIONAMENTO
CREATE TABLE IF NOT EXISTS public.operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Domingo, 6 = Sábado
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CATEGORIAS DO CARDÁPIO (Ex: Lanches Artesanais, Bebidas, Sobremesas)
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PRODUTOS DO CARDÁPIO
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL, -- Valor em centavos
    image_url TEXT,
    is_available BOOLEAN DEFAULT true, -- Permite pausar item sem apagar
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. GRUPOS DE ADICIONAIS / COMPLEMENTOS (Ex: "Escolha o ponto da carne", "Adicionais extras")
CREATE TABLE IF NOT EXISTS public.product_option_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    min_options INTEGER DEFAULT 0,
    max_options INTEGER DEFAULT 1,
    required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ITENS DE ADICIONAIS
CREATE TABLE IF NOT EXISTS public.product_option_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_cents INTEGER DEFAULT 0, -- Em centavos (ex: +R$ 4,00 = 400)
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ENDEREÇOS DOS CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    city_id UUID REFERENCES public.cities(id) ON DELETE RESTRICT,
    street VARCHAR(200) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    reference_point TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE RESTRICT,
    delivery_address JSONB NOT NULL, -- Cópia do endereço no momento do pedido
    subtotal_cents INTEGER NOT NULL,
    delivery_fee_cents INTEGER NOT NULL,
    discount_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL, -- Comissão calculada da plataforma
    restaurant_net_cents INTEGER NOT NULL, -- Líquido a ser repassado ao restaurante
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'canceled')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'cash_on_delivery')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    asaas_payment_id VARCHAR(100),
    change_for_cents INTEGER, -- Troco para quanto em caso de dinheiro
    customer_notes TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price_cents INTEGER NOT NULL,
    selected_options JSONB, -- Histórico de adicionais selecionados
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Exemplo de Políticas RLS:
-- Restaurantes públicos visíveis para todos
CREATE POLICY "Restaurantes aprovados visíveis para todos" 
ON public.restaurants FOR SELECT 
USING (status = 'approved');

-- Donos podem ver e editar seus próprios restaurantes
CREATE POLICY "Donos gerenciam seu próprio restaurante" 
ON public.restaurants FOR ALL 
USING (auth.uid() = owner_id);
