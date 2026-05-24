/*
  # Integração FNRH - Ficha Nacional de Registro de Hóspedes

  Adiciona colunas para armazenar IDs retornados pela API FNRH (SERPRO/MTur)
  e campos de checkout efetivo.
*/

ALTER TABLE pousadajuliana_hospedes
  ADD COLUMN IF NOT EXISTS fnrh_pessoa_id text;

ALTER TABLE pousadajuliana_hospedagens
  ADD COLUMN IF NOT EXISTS fnrh_reserva_id      text,
  ADD COLUMN IF NOT EXISTS fnrh_hospede_id      text,
  ADD COLUMN IF NOT EXISTS motivo_viagem_id     text,
  ADD COLUMN IF NOT EXISTS meio_transporte_id   text,
  ADD COLUMN IF NOT EXISTS data_checkout        timestamptz;
