/*
  # Dados FNRH no cadastro do hóspede

  Adiciona campos demográficos e de localidade coletados no formulário,
  necessários para o check-in na FNRH feito pelo administrador.
  Torna data_checkin nullable (check-in agora é registrado pelo admin).
*/

ALTER TABLE pousadajuliana_hospedes
  ADD COLUMN IF NOT EXISTS genero_id           text,
  ADD COLUMN IF NOT EXISTS raca_id             text,
  ADD COLUMN IF NOT EXISTS deficiencia_id      text,
  ADD COLUMN IF NOT EXISTS pais_nacionalidade_id text,
  ADD COLUMN IF NOT EXISTS pais_residencia_id  text,
  ADD COLUMN IF NOT EXISTS cidade_id           integer,
  ADD COLUMN IF NOT EXISTS cidade_nome         text,
  ADD COLUMN IF NOT EXISTS cidade_estado       text;

ALTER TABLE pousadajuliana_hospedagens
  ALTER COLUMN data_checkin DROP NOT NULL;
