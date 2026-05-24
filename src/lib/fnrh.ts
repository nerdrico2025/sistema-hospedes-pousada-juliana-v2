import { supabase } from './supabase'

// A API FNRH (SERPRO) espera datetime no horário de Brasília (UTC-3) sem sufixo Z.
// Enviar UTC com "Z" faz a API interpretar o horário como futuro e rejeitar o checkin.
function nowBRT(): string {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return brt.toISOString().slice(0, 19) // "2026-04-29T10:48:32"
}

export interface FnrhDominio {
  id: string
  label: string
}

async function fnrhFetch(path: string, options: { method?: string; body?: object } = {}): Promise<any> {
  const { data: result, error } = await supabase.functions.invoke('fnrh-proxy', {
    body: {
      path,
      method: options.method ?? 'GET',
      ...(options.body !== undefined ? { body: options.body } : {}),
    },
  })

  if (error) throw new Error(`Edge Function: ${error.message}`)
  if (!result.ok) {
    const detail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
    throw new Error(`FNRH ${result.status}: ${detail}`)
  }

  return result.data
}

function normalizeDominios(data: any): FnrhDominio[] {
  const list = Array.isArray(data) ? data : (data?.dados ?? data?.items ?? data?.data ?? data?.resultado ?? [])
  return list.map((item: any) => ({
    id: String(item.id ?? item.codigo ?? item.value ?? ''),
    label: String(item.label ?? item.descricao ?? item.nome ?? item.name ?? item.id ?? ''),
  }))
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function getCached(key: string): FnrhDominio[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function setCache(key: string, data: FnrhDominio[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

async function buscarDominio(path: string, cacheKey: string): Promise<FnrhDominio[]> {
  const cached = getCached(cacheKey)
  if (cached) return cached
  const data = await fnrhFetch(path)
  const result = normalizeDominios(data)
  setCache(cacheKey, result)
  return result
}

export async function buscarMotivosViagem(): Promise<FnrhDominio[]> {
  return buscarDominio('/dominios/fnrh/motivos_viagem', 'fnrh_motivos_viagem')
}

export async function buscarMeiosTransporte(): Promise<FnrhDominio[]> {
  return buscarDominio('/dominios/fnrh/meios_transporte', 'fnrh_meios_transporte')
}

export async function buscarGeneros(): Promise<FnrhDominio[]> {
  return buscarDominio('/dominios/pessoas/generos', 'fnrh_generos')
}

export async function criarOuObterPessoa(params: {
  nome: string
  cpf: string
  dataNascimento: string
  email?: string
  telefone?: string
  generoId?: string
  racaId?: string
  deficienciaId?: string
  paisNacionalidadeId?: string
  paisResidenciaId?: string
  cidadeId?: number
  estadoId?: string
}): Promise<string> {
  const cpfNumeros = params.cpf.replace(/\D/g, '')

  // Verifica se a pessoa já existe antes de tentar cadastrar
  try {
    const existing = await fnrhFetch(`/pessoas/documento/CPF/${cpfNumeros}`)
    const existingId = existing?.dados?.id ?? existing?.id ?? existing?.pessoa_id
    if (existingId) return existingId
  } catch {
    // 404 ou erro — pessoa não existe, segue para o cadastro
  }

  const contato: Record<string, unknown> = {
    PaisResidencia_id: params.paisResidenciaId ?? 'BR',
    ...(params.email && { email: params.email }),
    ...(params.telefone && { telefone: params.telefone.replace(/\D/g, '') }),
  }

  if (params.cidadeId) {
    contato.cidade_id = params.cidadeId
  }
  if (params.estadoId) {
    contato.estado_id = params.estadoId
  }

  const data = await fnrhFetch('/pessoas', {
    method: 'POST',
    body: {
      pessoa: {
        nome: params.nome,
        data_nascimento: params.dataNascimento,
        PaisNacionalidade_id: params.paisNacionalidadeId ?? 'BR',
        genero_id: params.generoId ?? 'NAOINFORMADO',
        raca_id: params.racaId ?? 'NAOINFORMAR',
        deficiencia_id: params.deficienciaId ?? 'NAOINFORMAR',
        documento_id: {
          numero_documento: cpfNumeros,
          tipo_documento_id: 'CPF',
        },
        contato,
      },
    },
  })

  const newId = data?.dados?.id ?? data?.id ?? data?.pessoa_id
  if (!newId) throw new Error('FNRH: cadastro de pessoa não retornou ID.')
  return newId
}

export async function criarReserva(params: {
  cpf: string
  dataEntrada: string
  dataSaida: string
}): Promise<string> {
  const cpfNumeros = params.cpf.replace(/\D/g, '')
  const numeroReserva = `${Date.now()}-${cpfNumeros.slice(-6)}`

  const data = await fnrhFetch('/reservas', {
    method: 'POST',
    body: {
      numero_reserva: numeroReserva,
      data_entrada: params.dataEntrada,
      data_saida: params.dataSaida,
      quantidade_hospede_adulto: 1,
      quantidade_hospede_menor: 0,
      origem_reserva_id: 'MEIOHOSPEDAGEM',
    },
  })
  const reservaId = data?.reserva?.reserva_id ?? data?.reserva_id ?? data?.id ?? data?.dados?.reserva_id
  if (!reservaId) throw new Error(`FNRH: criarReserva não retornou ID. Resposta: ${JSON.stringify(data)}`)
  return reservaId
}

export async function adicionarHospedeNaReserva(params: {
  reservaId: string
  pessoaId: string
  motivoViagemId: string
  meioTransporteId: string
}): Promise<string> {
  const data = await fnrhFetch(`/reservas/${params.reservaId}/hospedes`, {
    method: 'POST',
    body: {
      pessoa_id: params.pessoaId,
      is_principal: true,
      situacao_hospede_id: 'CHECKIN_REALIZADO',
      checkin_em: nowBRT(),
      fnrh: {
        motivo_viagem_id: params.motivoViagemId,
        meio_transporte_id: params.meioTransporteId,
      },
    },
  })
  const hospedeId = data?.id ?? data?.hospede_id ?? data?.dados?.id
  if (!hospedeId) throw new Error(`FNRH: adicionarHospedeNaReserva não retornou ID. Resposta: ${JSON.stringify(data)}`)
  return hospedeId
}

export async function enviarCheckin(fnrhHospedeId: string): Promise<void> {
  await fnrhFetch(`/hospedes/${fnrhHospedeId}/checkin`, {
    method: 'PATCH',
    body: { data_hora: nowBRT() },
  })
}

export async function enviarCheckout(fnrhHospedeId: string): Promise<void> {
  await fnrhFetch(`/hospedes/${fnrhHospedeId}/checkout`, {
    method: 'PATCH',
    body: { data_hora: nowBRT() },
  })
}
