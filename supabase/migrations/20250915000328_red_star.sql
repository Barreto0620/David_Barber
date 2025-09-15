/*
  # Criar usuário de autenticação para o sistema

  1. Configuração de Autenticação
    - Criar usuário administrador padrão
    - Email: david.silva@davidbarber.com
    - Senha: 123456
    - Username: david.silva

  2. Segurança
    - Configurar políticas de acesso
    - Habilitar autenticação por email/senha
*/

-- Inserir usuário administrador via SQL (será executado no Supabase)
-- Nota: Este usuário deve ser criado manualmente no painel do Supabase Auth
-- Email: david.silva@davidbarber.com
-- Senha: 123456
-- Metadata: {"username": "david.silva", "role": "admin"}

-- Criar tabela de perfis de usuário se necessário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados
CREATE POLICY "Users can view and update own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Administrador'),
    COALESCE(new.raw_user_meta_data->>'role', 'admin')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();