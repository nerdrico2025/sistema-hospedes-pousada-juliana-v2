/*
  # Adiciona políticas de UPDATE ausentes

  As tabelas abaixo tinham RLS habilitado porém sem política de UPDATE,
  o que fazia os comandos UPDATE retornarem sem erro mas não alterarem
  nenhuma linha. O resultado era perda silenciosa de dados (ex: fnrh_hospede_id
  nunca era salvo após o check-in, voltando ao estado anterior após relogin).
*/

-- Hospedagens
DROP POLICY IF EXISTS "Permitir atualização pública de hospedagens" ON pousadajuliana_hospedagens;
CREATE POLICY "Permitir atualização pública de hospedagens"
  ON pousadajuliana_hospedagens
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Administradores: UPDATE
DROP POLICY IF EXISTS "Permitir atualização de administradores" ON pousadajuliana_administradores;
CREATE POLICY "Permitir atualização de administradores"
  ON pousadajuliana_administradores
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Administradores: INSERT
DROP POLICY IF EXISTS "Permitir inserção de administradores" ON pousadajuliana_administradores;
CREATE POLICY "Permitir inserção de administradores"
  ON pousadajuliana_administradores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Quartos
DROP POLICY IF EXISTS "Permitir atualização de quartos" ON pousadajuliana_quartos;
CREATE POLICY "Permitir atualização de quartos"
  ON pousadajuliana_quartos
  FOR UPDATE
  TO anon, authenticated
  USING (true);
