import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, User, Mail, Phone, MapPin, Save, ArrowLeft, Landmark } from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import Select from '../components/Select'
import DateInput from '../components/DateInput'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { buscarMotivosViagem, buscarMeiosTransporte, type FnrhDominio } from '../lib/fnrh'
import { PAISES, isBrasil } from '../lib/geodata'
import CidadeAutocomplete from '../components/CidadeAutocomplete'
import { NovoHospede } from '../types'

const GENEROS = [
  { value: 'HOMEM', label: 'Masculino' },
  { value: 'MULHER', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outros' },
  { value: 'NAOINFORMADO', label: 'Prefiro não informar' },
]

const RACAS = [
  { value: 'AMARELA', label: 'Amarelo' },
  { value: 'BRANCA', label: 'Branco' },
  { value: 'INDIGENA', label: 'Indígena' },
  { value: 'PARDA', label: 'Pardo' },
  { value: 'PRETA', label: 'Preto' },
  { value: 'NAOINFORMAR', label: 'Prefiro não informar' },
]

const DEFICIENCIAS = [
  { value: 'SIM', label: 'Sim' },
  { value: 'NAO', label: 'Não' },
  { value: 'NAOINFORMAR', label: 'Prefiro não informar' },
]

const PAIS_OPTIONS = PAISES.map((p) => ({ value: p.value, label: p.label }))

const EMPTY_FORM: NovoHospede = {
  nome_completo: '',
  cpf: '',
  email: '',
  telefone: '',
  data_nascimento: '',
  data_entrada: '',
  data_saida: '',
  motivo_viagem_id: '',
  meio_transporte_id: '',
  genero_id: '',
  raca_id: '',
  deficiencia_id: '',
  pais_nacionalidade_id: 'BR',
  pais_residencia_id: 'BR',
  cidade_id: '',
  cidade_nome: '',
  numero_pessoas: '',
  quarto_id: '',
}

function toISO(d: string): string {
  if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d
  if (d.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = d.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return d
}

export default function Cadastrar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [motivosViagem, setMotivosViagem] = useState<FnrhDominio[]>([])
  const [meiosTransporte, setMeiosTransporte] = useState<FnrhDominio[]>([])
  const [dominiosLoading, setDominiosLoading] = useState(true)
  const [dominiosErro, setDominiosErro] = useState(false)

  const [formData, setFormData] = useState<NovoHospede>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof NovoHospede, string>>>({})
  const [cidadeEstado, setCidadeEstado] = useState('')

  // TODO: reativar quando o campo de quarto voltar
  // const [quartos, setQuartos] = useState<Quarto[]>([])
  // const [quartosLoading, setQuartosLoading] = useState(false)
  // const [quartosMensagem, setQuartosMensagem] = useState('')

  useEffect(() => {
    async function carregarDominios() {
      try {
        const [motivos, meios] = await Promise.all([
          buscarMotivosViagem(),
          buscarMeiosTransporte(),
        ])
        setMotivosViagem(motivos)
        setMeiosTransporte(meios)
      } catch {
        setDominiosErro(true)
      } finally {
        setDominiosLoading(false)
      }
    }
    carregarDominios()
  }, [])

  // TODO: reativar quando o campo de quarto voltar
  // useEffect(() => {
  //   const entrada = formData.data_entrada
  //   const saida = formData.data_saida
  //   if (!entrada || !saida) {
  //     setQuartos([]); setQuartosMensagem(''); setFormData((prev) => ({ ...prev, quarto_id: '' })); return
  //   }
  //   const entradaISO = toISO(entrada)
  //   const saidaISO = toISO(saida)
  //   if (new Date(entradaISO) >= new Date(saidaISO)) return
  //   let cancelled = false
  //   setQuartosLoading(true); setQuartosMensagem(''); setFormData((prev) => ({ ...prev, quarto_id: '' }))
  //   async function fetchQuartos() {
  //     try {
  //       const { data: ocupados } = await supabase.from('pousadajuliana_hospedagens').select('quarto_id')
  //         .not('quarto_id', 'is', null).is('data_checkout', null).lt('data_entrada', saidaISO).gt('data_saida', entradaISO)
  //       const ocupadosIds = (ocupados ?? []).map((h: { quarto_id: string | null }) => h.quarto_id).filter(Boolean) as string[]
  //       let query = supabase.from('pousadajuliana_quartos').select('*').eq('ativo', true).order('numero')
  //       if (ocupadosIds.length > 0) query = query.not('id', 'in', `(${ocupadosIds.join(',')})`)
  //       const { data, error } = await query
  //       if (cancelled) return
  //       if (error) throw error
  //       const disponiveis = data ?? []
  //       setQuartos(disponiveis)
  //       if (disponiveis.length === 0) setQuartosMensagem('Nenhum quarto disponível para este período')
  //     } catch (err) {
  //       if (!cancelled) console.error('Erro ao buscar quartos:', err)
  //     } finally {
  //       if (!cancelled) setQuartosLoading(false)
  //     }
  //   }
  //   fetchQuartos()
  //   return () => { cancelled = true }
  // }, [formData.data_entrada, formData.data_saida])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const handleInputChange = (field: keyof NovoHospede, value: string) => {
    let formatted = value
    if (field === 'cpf') formatted = formatCPF(value)
    else if (field === 'telefone') formatted = formatPhone(value)

    setFormData((prev) => {
      const next = { ...prev, [field]: formatted }
      if (field === 'pais_residencia_id') {
        next.cidade_id = ''
        next.cidade_nome = ''
        setCidadeEstado('')
      }
      return next
    })

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof NovoHospede, string>> = {}

    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome obrigatório'
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email obrigatório'
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone obrigatório'
    if (!formData.data_nascimento) newErrors.data_nascimento = 'Data de nascimento obrigatória'
    if (!formData.data_entrada) newErrors.data_entrada = 'Data de entrada obrigatória'
    if (!formData.data_saida) newErrors.data_saida = 'Data de saída obrigatória'
    if (formData.email && !formData.email.includes('@')) newErrors.email = 'Email inválido'
    if (!formData.motivo_viagem_id) newErrors.motivo_viagem_id = 'Motivo da viagem obrigatório'
    if (!formData.meio_transporte_id) newErrors.meio_transporte_id = 'Meio de transporte obrigatório'
    if (!formData.genero_id) newErrors.genero_id = 'Gênero obrigatório'
    if (!formData.raca_id) newErrors.raca_id = 'Raça/etnia obrigatória'
    if (!formData.deficiencia_id) newErrors.deficiencia_id = 'Campo obrigatório'
    if (!formData.pais_nacionalidade_id) newErrors.pais_nacionalidade_id = 'País de nacionalidade obrigatório'
    if (!formData.pais_residencia_id) newErrors.pais_residencia_id = 'País de residência obrigatório'

    if (isBrasil(formData.pais_residencia_id) && !formData.cidade_id) {
      newErrors.cidade_id = 'Cidade obrigatória'
    } else if (!isBrasil(formData.pais_residencia_id) && !formData.cidade_nome.trim()) {
      newErrors.cidade_nome = 'Cidade obrigatória'
    }

    // TODO: reativar quando os campos de quarto e número de pessoas voltarem
    // const npNum = Number(formData.numero_pessoas)
    // if (!formData.numero_pessoas || isNaN(npNum) || npNum < 1) {
    //   newErrors.numero_pessoas = 'Mínimo 1 pessoa'
    // }
    // if (!formData.quarto_id) {
    //   newErrors.quarto_id = 'Selecione um quarto'
    // }

    if (
      formData.data_entrada &&
      formData.data_saida &&
      new Date(toISO(formData.data_entrada)) >= new Date(toISO(formData.data_saida))
    ) {
      newErrors.data_saida = 'Data de saída deve ser posterior à entrada'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      const { data: hospede, error: hospedeError } = await supabase
        .from('pousadajuliana_hospedes')
        .insert({
          nome_completo: formData.nome_completo,
          cpf: formData.cpf.replace(/\D/g, ''),
          email: formData.email,
          telefone: formData.telefone.replace(/\D/g, ''),
          data_nascimento: toISO(formData.data_nascimento),
          genero_id: formData.genero_id || null,
          raca_id: formData.raca_id || null,
          deficiencia_id: formData.deficiencia_id || null,
          pais_nacionalidade_id: formData.pais_nacionalidade_id || null,
          pais_residencia_id: formData.pais_residencia_id || null,
          cidade_id: formData.cidade_id ? Number(formData.cidade_id) : null,
          cidade_nome: formData.cidade_nome || null,
          cidade_estado: cidadeEstado || null,
        })
        .select()
        .single()

      if (hospedeError) throw hospedeError

      const { error: hospedagemError } = await supabase
        .from('pousadajuliana_hospedagens')
        .insert({
          hospede_id: hospede.id,
          data_entrada: toISO(formData.data_entrada),
          data_saida: toISO(formData.data_saida),
          motivo_viagem_id: formData.motivo_viagem_id,
          meio_transporte_id: formData.meio_transporte_id,
          quarto_id: null,
          numero_pessoas: null,
        })

      if (hospedagemError) throw hospedagemError

      setShowSuccess(true)
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error)
      alert(`Erro ao cadastrar hóspede: ${error.message || 'Tente novamente.'}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowSuccess(false)
    setFormData(EMPTY_FORM)
    setErrors({})
    setCidadeEstado('')
  }

  if (showSuccess) {
    return (
      <Layout title="Cadastro Realizado!">
        <div className="max-w-md mx-auto">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-800 mb-2">Hóspede Cadastrado!</h3>
            <p className="text-emerald-600 mb-6">
              O cadastro de <strong>{formData.nome_completo}</strong> foi salvo com sucesso.
              O check-in na FNRH será confirmado pelo administrador.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} variant="success" className="w-full">
                Voltar ao Início
              </Button>
              <Button onClick={resetForm} variant="secondary" className="w-full">
                Novo Cadastro
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const motivoOptions = motivosViagem.map((m) => ({ value: m.id, label: m.label }))
  const meioOptions = meiosTransporte.map((m) => ({ value: m.id, label: m.label }))
  const residenciaBrasil = isBrasil(formData.pais_residencia_id)

  return (
    <Layout title="Cadastrar Novo Hóspede">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Dados pessoais */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  name="name"
                  autoComplete="name"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  error={errors.nome_completo}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  placeholder="Digite o nome completo"
                />
              </div>

              <Input
                label="CPF"
                name="cpf"
                autoComplete="off"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                error={errors.cpf}
                placeholder="000.000.000-00"
                maxLength={14}
              />

              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                placeholder="email@exemplo.com"
              />

              <Input
                label="Telefone com DDD"
                name="tel"
                autoComplete="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                error={errors.telefone}
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />

              <DateInput
                label="Data de Nascimento"
                name="bday"
                autoComplete="bday"
                value={formData.data_nascimento}
                onChange={(value) => handleInputChange('data_nascimento', value)}
                error={errors.data_nascimento}
                placeholder="dd/mm/aaaa"
              />
            </div>

            {/* Período da hospedagem */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-sky-500 mr-2" />
                Período da Hospedagem
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <DateInput
                  label="Data de Entrada"
                  value={formData.data_entrada}
                  onChange={(value) => handleInputChange('data_entrada', value)}
                  error={errors.data_entrada}
                  placeholder="dd/mm/aaaa"
                />
                <DateInput
                  label="Data de Saída"
                  value={formData.data_saida}
                  onChange={(value) => handleInputChange('data_saida', value)}
                  error={errors.data_saida}
                  placeholder="dd/mm/aaaa"
                  min={formData.data_entrada || new Date().toISOString().split('T')[0]}
                />

                {/* TODO: reativar quando os campos de quarto e número de pessoas voltarem */}
                {/* Número de Pessoas */}
                {/* <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Pessoas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.numero_pessoas}
                    onChange={(e) => handleInputChange('numero_pessoas', e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                      errors.numero_pessoas
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                    }`}
                    placeholder="1"
                  />
                  {errors.numero_pessoas && (
                    <p className="text-xs text-red-500 mt-1">{errors.numero_pessoas}</p>
                  )}
                </div> */}

                {/* Quarto */}
                {/* <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Quarto <span className="text-red-500">*</span>
                  </label>
                  {quartosLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                      <svg className="animate-spin h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando disponibilidade…
                    </div>
                  ) : quartosMensagem && quartos.length === 0 ? (
                    <p className="text-sm text-amber-600 py-2">{quartosMensagem}</p>
                  ) : (
                    <select
                      value={formData.quarto_id}
                      onChange={(e) => handleInputChange('quarto_id', e.target.value)}
                      disabled={!formData.data_entrada || !formData.data_saida || quartos.length === 0}
                      className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                        errors.quarto_id
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                      }`}
                    >
                      <option value="">
                        {!formData.data_entrada || !formData.data_saida
                          ? 'Preencha as datas primeiro'
                          : 'Selecione o quarto'}
                      </option>
                      {quartos.map((q) => (
                        <option key={q.id} value={q.id}>
                          Quarto {q.numero}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.quarto_id && !quartosMensagem && (
                    <p className="text-xs text-red-500 mt-1">{errors.quarto_id}</p>
                  )}
                </div> */}
              </div>
            </div>

            {/* Dados FNRH */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="h-5 w-5 text-amber-500" />
                <h4 className="text-lg font-semibold text-gray-800">Ficha Nacional de Registro (FNRH)</h4>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Dados obrigatórios pelo Ministério do Turismo. O check-in na FNRH será confirmado pelo administrador.
              </p>

              {/* Gênero, Raça e Deficiência */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Select
                  label="Gênero"
                  value={formData.genero_id}
                  onChange={(e) => handleInputChange('genero_id', e.target.value)}
                  error={errors.genero_id}
                  options={GENEROS}
                  placeholder="Selecione"
                />
                <Select
                  label="Raça / Etnia"
                  value={formData.raca_id}
                  onChange={(e) => handleInputChange('raca_id', e.target.value)}
                  error={errors.raca_id}
                  options={RACAS}
                  placeholder="Selecione"
                />
                <Select
                  label="Possui Deficiência?"
                  value={formData.deficiencia_id}
                  onChange={(e) => handleInputChange('deficiencia_id', e.target.value)}
                  error={errors.deficiencia_id}
                  options={DEFICIENCIAS}
                  placeholder="Selecione"
                />
              </div>

              {/* Países */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Select
                  label="País de Nacionalidade"
                  value={formData.pais_nacionalidade_id}
                  onChange={(e) => handleInputChange('pais_nacionalidade_id', e.target.value)}
                  error={errors.pais_nacionalidade_id}
                  options={PAIS_OPTIONS}
                  placeholder="Selecione"
                />
                <Select
                  label="País de Residência"
                  value={formData.pais_residencia_id}
                  onChange={(e) => handleInputChange('pais_residencia_id', e.target.value)}
                  error={errors.pais_residencia_id}
                  options={PAIS_OPTIONS}
                  placeholder="Selecione"
                />
              </div>

              {/* Cidade — condicional */}
              <div className="mb-6">
                {residenciaBrasil ? (
                  <CidadeAutocomplete
                    value={formData.cidade_id}
                    onChange={(ibge, estado) => {
                      handleInputChange('cidade_id', ibge)
                      setCidadeEstado(estado)
                    }}
                    error={errors.cidade_id}
                  />
                ) : (
                  <Input
                    label="Cidade de Residência"
                    value={formData.cidade_nome}
                    onChange={(e) => handleInputChange('cidade_nome', e.target.value)}
                    error={errors.cidade_nome}
                    placeholder="Nome da cidade"
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  />
                )}
              </div>

              {/* Motivo e Transporte */}
              {dominiosLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <svg className="animate-spin h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Carregando opções…
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <Select
                    label="Motivo da Viagem"
                    value={formData.motivo_viagem_id}
                    onChange={(e) => handleInputChange('motivo_viagem_id', e.target.value)}
                    error={errors.motivo_viagem_id}
                    options={motivoOptions}
                    placeholder="Selecione o motivo"
                    disabled={dominiosErro || motivoOptions.length === 0}
                  />
                  <Select
                    label="Meio de Transporte"
                    value={formData.meio_transporte_id}
                    onChange={(e) => handleInputChange('meio_transporte_id', e.target.value)}
                    error={errors.meio_transporte_id}
                    options={meioOptions}
                    placeholder="Selecione o meio"
                    disabled={dominiosErro || meioOptions.length === 0}
                  />
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/')}
                icon={ArrowLeft}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                loading={loading}
                icon={Save}
                className="flex-1"
                disabled={dominiosLoading}
              >
                Cadastrar Hóspede
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
