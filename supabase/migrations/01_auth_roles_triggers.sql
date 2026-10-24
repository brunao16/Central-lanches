-- ==============================================================================
-- MIGRAÇÃO 01: AUTENTICAÇÃO, TRIGGER DE PERFIS E PAPÉIS
-- ==============================================================================

-- 1. Atualizar a restrição de papéis da tabela profiles para incluir 'courier'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'restaurant_owner', 'courier', 'admin'));

-- 2. Criar função e trigger para criar profile automaticamente ao cadastrar em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        'customer' -- SEGURANÇA: Todo usuário obrigatoriamente nasce como customer
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associar trigger à tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- COMANDOS PARA O ADMINISTRADOR (EXECUTAR NO SQL EDITOR DO SUPABASE SE DESEJAR):
-- ==============================================================================
-- Para promover um usuário a ADMIN pelo e-mail:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'seu_email@exemplo.com';
--
-- Para promover um entregador:
-- UPDATE public.profiles SET role = 'courier' WHERE email = 'entregador@exemplo.com';
