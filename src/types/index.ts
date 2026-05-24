export interface Hospede {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  data_cadastro: string
  fnrh_pessoa_id?: string
  genero_id?: string
  raca_id?: string
  deficiencia_id?: string
  pais_nacionalidade_id?: string
  pais_residencia_id?: string
  cidade_id?: number
  cidade_nome?: string
  cidade_estado?: string
}

export interface Quarto {
  id: string
  numero: number
  ativo: boolean
}

export interface Hospedagem {
  id: string
  hospede_id: string
  data_entrada: string
  data_saida: string
  data_checkin?: string
  data_checkout?: string
  fnrh_reserva_id?: string
  fnrh_hospede_id?: string
  motivo_viagem_id?: string
  meio_transporte_id?: string
  quarto_id?: string
  numero_pessoas?: number
}

export interface HospedeComHistorico extends Hospede {
  hospedagens: Hospedagem[]
}

export interface Administrador {
  id: string
  usuario: string
  senha: string
  nome: string
  perfil?: string
  ativo?: boolean
}

export interface NovoHospede {
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  data_entrada: string
  data_saida: string
  motivo_viagem_id: string
  meio_transporte_id: string
  genero_id: string
  raca_id: string
  deficiencia_id: string
  pais_nacionalidade_id: string
  pais_residencia_id: string
  cidade_id: string
  cidade_nome: string
  numero_pessoas: string
  quarto_id: string
}

export interface FnrhDominio {
  id: string
  label: string
}
