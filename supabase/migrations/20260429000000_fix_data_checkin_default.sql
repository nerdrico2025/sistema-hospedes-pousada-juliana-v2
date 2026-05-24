/*
  # Corrige data_checkin com DEFAULT now()

  A coluna data_checkin foi criada com DEFAULT now(), o que fazia toda nova
  hospedagem receber automaticamente o timestamp de inserção — mesmo sem
  nenhum check-in FNRH ter sido realizado de fato.

  1. Remove o DEFAULT para que novas hospedagens fiquem com data_checkin NULL
  2. Zera data_checkin nas hospedagens onde fnrh_hospede_id IS NULL
     (check-in FNRH nunca foi executado)
*/

ALTER TABLE pousadajuliana_hospedagens
  ALTER COLUMN data_checkin DROP DEFAULT;

UPDATE pousadajuliana_hospedagens
  SET data_checkin = NULL
  WHERE fnrh_hospede_id IS NULL;
