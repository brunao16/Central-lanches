-- ==============================================================================
-- SCRIPT DE TESTE DE POLICIES RLS (TESTE DE PERMISSÕES NO SUPABASE)
-- Execute no SQL Editor para validar o comportamento de cada perfil
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '--- INICIANDO TESTE DE RLS ---';
END $$;

-- 1. Teste de Leitura Anônima (deve listar restaurantes aprovados)
SELECT count(*) AS total_restaurantes_publicos 
FROM public.restaurants 
WHERE status = 'approved';

-- 2. Teste de Leitura de Cardápio por visitante
SELECT count(*) AS total_produtos_disponiveis 
FROM public.products 
WHERE is_available = true;

-- 3. Validação de bloqueio de visualização de pedidos anônimos
-- Em ambiente real com auth anônimo, a consulta abaixo deve retornar 0 linhas
SELECT count(*) AS pedidos_visiveis_anonimo 
FROM public.orders;

-- 4. Validação de função is_admin
SELECT public.is_admin() AS sou_administrador;
