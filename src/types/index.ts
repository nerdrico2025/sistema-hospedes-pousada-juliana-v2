export interface Hospede {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  data_cadastro: string
}

export interface Hospedagem {
  id: string
  hospede_id: string
  data_entrada: string
  data_saida: string
  data_checkin: string
}

export interface HospedeComHistorico extends Hospede {
  hospedagens: Hospedagem[]
}

export interface Administrador {
  id: string
  usuario: string
  senha: string
  nome: string
}

export interface NovoHospede {
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  data_entrada: string
  data_saida: string
}