-- Adiciona coluna ativo e perfil em pousadajuliana_administradores
ALTER TABLE pousadajuliana_administradores
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS perfil text NOT NULL DEFAULT 'funcionario';

-- Garante que o admin padrão seja perfil admin
UPDATE pousadajuliana_administradores
SET perfil = 'admin'
WHERE usuario = 'admin';

-- Políticas para INSERT e UPDATE em administradores
CREATE POLICY IF NOT EXISTS "Permitir inserção de administradores"
  ON pousadajuliana_administradores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Permitir atualização de administradores"
  ON pousadajuliana_administradores
  FOR UPDATE
  TO anon, authenticated
  USING (true);
