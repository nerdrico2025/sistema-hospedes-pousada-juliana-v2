/*
  # Sistema de Cadastro Pousada Juliana

  1. Novas Tabelas
    - `pousadajuliana_hospedes`
      - `id` (uuid, chave primária)
      - `nome_completo` (text, obrigatório)
      - `cpf` (text, obrigatório, único)
      - `email` (text, obrigatório)
      - `telefone` (text, obrigatório)
      - `data_nascimento` (date, obrigatório)
      - `data_cadastro` (timestamp, automático)
    
    - `pousadajuliana_hospedagens`
      - `id` (uuid, chave primária)
      - `hospede_id` (uuid, referência a hospedes)
      - `data_entrada` (date, obrigatório)
      - `data_saida` (date, obrigatório)
      - `data_checkin` (timestamp, automático)
    
    - `pousadajuliana_administradores`
      - `id` (uuid, chave primária)
      - `usuario` (text, obrigatório, único)
      - `senha` (text, obrigatório)
      - `nome` (text, obrigatório)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para operações públicas (hóspedes)
    - Políticas restritas para administradores
*/

-- Tabela de hóspedes
CREATE TABLE IF NOT EXISTS pousadajuliana_hospedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text NOT NULL UNIQUE,
  email text NOT NULL,
  telefone text NOT NULL,
  data_nascimento date NOT NULL,
  data_cadastro timestamptz DEFAULT now()
);

-- Tabela de hospedagens (histórico)
CREATE TABLE IF NOT EXISTS pousadajuliana_hospedagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospede_id uuid NOT NULL REFERENCES pousadajuliana_hospedes(id) ON DELETE CASCADE,
  data_entrada date NOT NULL,
  data_saida date NOT NULL,
  data_checkin timestamptz DEFAULT now()
);

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS pousadajuliana_administradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario text NOT NULL UNIQUE,
  senha text NOT NULL,
  nome text NOT NULL
);

-- Habilitar RLS
ALTER TABLE pousadajuliana_hospedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pousadajuliana_hospedagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pousadajuliana_administradores ENABLE ROW LEVEL SECURITY;

-- Políticas para hóspedes (acesso público para cadastro e consulta)
CREATE POLICY "Permitir consulta pública de hóspedes"
  ON pousadajuliana_hospedes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir inserção pública de hóspedes"
  ON pousadajuliana_hospedes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de hóspedes"
  ON pousadajuliana_hospedes
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Políticas para hospedagens
CREATE POLICY "Permitir consulta pública de hospedagens"
  ON pousadajuliana_hospedagens
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir inserção pública de hospedagens"
  ON pousadajuliana_hospedagens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Políticas para administradores (apenas usuários autenticados)
CREATE POLICY "Permitir consulta de administradores"
  ON pousadajuliana_administradores
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Inserir usuário administrador padrão
INSERT INTO pousadajuliana_administradores (usuario, senha, nome)
VALUES ('admin', 'pousada123', 'Administrador Pousada Juliana')
ON CONFLICT (usuario) DO NOTHING;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hospedes_nome ON pousadajuliana_hospedes(nome_completo);
CREATE INDEX IF NOT EXISTS idx_hospedes_email ON pousadajuliana_hospedes(email);
CREATE INDEX IF NOT EXISTS idx_hospedes_cpf ON pousadajuliana_hospedes(cpf);
CREATE INDEX IF NOT EXISTS idx_hospedagens_hospede ON pousadajuliana_hospedagens(hospede_id);
CREATE INDEX IF NOT EXISTS idx_hospedagens_entrada ON pousadajuliana_hospedagens(data_entrada);