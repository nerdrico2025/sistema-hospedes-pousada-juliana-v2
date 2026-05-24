import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, LogOut, Users, Calendar,
  ChevronDown, CheckCircle, AlertCircle, LogIn, LogOut as LogOutIcon,
  Pencil, X, Save, FilterX, BedDouble, ToggleLeft, ToggleRight,
  UserCog, UserPlus, Shield, User as UserIcon, Printer,
} from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import CidadeAutocomplete from '../components/CidadeAutocomplete'
import { supabase } from '../lib/supabase'
import {
  criarOuObterPessoa,
  criarReserva,
  adicionarHospedeNaReserva,
  enviarCheckout,
  buscarMotivosViagem,
  buscarMeiosTransporte,
  type FnrhDominio,
} from '../lib/fnrh'
import { PAISES, isBrasil } from '../lib/geodata'
import { HospedeComHistorico, Hospedagem, Quarto, Administrador } from '../types'
import FichaModal from '../components/FichaModal'

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

interface EditForm {
  // Reserva
  data_entrada: string
  data_saida: string
  motivo_viagem_id: string
  meio_transporte_id: string
  // Hóspede
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  genero_id: string
  raca_id: string
  deficiencia_id: string
  pais_nacionalidade_id: string
  pais_residencia_id: string
  cidade_id: string
  cidade_nome: string
}

const EMPTY_EDIT: EditForm = {
  data_entrada: '',
  data_saida: '',
  motivo_viagem_id: '',
  meio_transporte_id: '',
  nome_completo: '',
  cpf: '',
  email: '',
  telefone: '',
  data_nascimento: '',
  genero_id: '',
  raca_id: '',
  deficiencia_id: '',
  pais_nacionalidade_id: 'BR',
  pais_residencia_id: 'BR',
  cidade_id: '',
  cidade_nome: '',
}

type StatusFnrh = '' | 'pendente' | 'checkin' | 'checkout'

type StatusQuarto = 'disponivel' | 'reservado' | 'ocupado' | 'inativo'

interface HospAtiva {
  data_entrada: string
  fnrh_hospede_id: string | null
}

function calcularStatusQuarto(quarto: Quarto, hospedagens: HospAtiva[], hoje: string): StatusQuarto {
  if (!quarto.ativo) return 'inativo'
  if (hospedagens.some((h) => !!h.fnrh_hospede_id && h.data_entrada <= hoje)) return 'ocupado'
  if (hospedagens.some((h) => !h.fnrh_hospede_id && h.data_entrada >= hoje)) return 'reservado'
  return 'disponivel'
}

interface Filters {
  status: StatusFnrh
  entradaDe: string
  entradaAte: string
  saidaDe: string
  saidaAte: string
}

const EMPTY_FILTERS: Filters = {
  status: '',
  entradaDe: '',
  entradaAte: '',
  saidaDe: '',
  saidaAte: '',
}

const toDateInput = (d?: string): string => {
  if (!d) return ''
  if (d.includes('T')) return d.split('T')[0]
  return d
}

export default function Admin() {
  const navigate = useNavigate()
  const [hospedes, setHospedes] = useState<HospedeComHistorico[]>([])
  const [filteredHospedes, setFilteredHospedes] = useState<HospedeComHistorico[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [checkinLoadingId, setCheckinLoadingId] = useState<string | null>(null)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingHospedeId, setEditingHospedeId] = useState<string | null>(null)
  const [editRestricted, setEditRestricted] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT)
  const [editCidadeEstado, setEditCidadeEstado] = useState('')
  const [editSavingId, setEditSavingId] = useState<string | null>(null)
  const [motivosViagem, setMotivosViagem] = useState<FnrhDominio[]>([])
  const [meiosTransporte, setMeiosTransporte] = useState<FnrhDominio[]>([])
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [quartoHospedagensAtivas, setQuartoHospedagensAtivas] = useState<Record<string, HospAtiva[]>>({})
  const [quartosLoading, setQuartosLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── Usuários ──
  const [usuarios, setUsuarios] = useState<Administrador[]>([])
  const [usuariosLoading, setUsuariosLoading] = useState(false)
  const [usuarioModal, setUsuarioModal] = useState<'criar' | 'editar' | null>(null)
  const [usuarioEditando, setUsuarioEditando] = useState<Administrador | null>(null)
  const [usuarioForm, setUsuarioForm] = useState({ nome: '', usuario: '', senha: '', perfil: 'funcionario' })
  const [usuarioFormErrors, setUsuarioFormErrors] = useState<Record<string, string>>({})
  const [usuarioSaving, setUsuarioSaving] = useState(false)
  const [usuarioTogglingId, setUsuarioTogglingId] = useState<string | null>(null)

  // ── Ficha de impressão ──
  const [fichaHospedeId, setFichaHospedeId] = useState<string | null>(null)
  const [fichaHospedagemId, setFichaHospedagemId] = useState<string | null>(null)

  useEffect(() => {
    const adminData = localStorage.getItem('admin_logado')
    if (!adminData) {
      navigate('/login-admin')
      return
    }
    const parsed = JSON.parse(adminData)
    setAdmin(parsed)
    loadHospedes()
    if (parsed.perfil === 'admin') {
      loadQuartos()
      loadUsuarios()
    }
  }, [navigate])

  useEffect(() => {
    Promise.all([buscarMotivosViagem(), buscarMeiosTransporte()])
      .then(([motivos, meios]) => {
        setMotivosViagem(motivos)
        setMeiosTransporte(meios)
      })
      .catch(() => {})
  }, [])

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  useEffect(() => {
    let result = hospedes

    if (searchTerm) {
      const term = normalize(searchTerm)
      const cpfDigits = searchTerm.replace(/\D/g, '')
      result = result.filter(
        (h) =>
          normalize(h.nome_completo).includes(term) ||
          normalize(h.email).includes(term) ||
          (cpfDigits.length > 0 && h.cpf.includes(cpfDigits))
      )
    }

    if (filters.status === 'pendente') {
      result = result.filter((h) => h.hospedagens.some((hosp) => !hosp.fnrh_hospede_id))
    } else if (filters.status === 'checkin') {
      result = result.filter((h) => h.hospedagens.some((hosp) => !!hosp.fnrh_hospede_id && !hosp.data_checkout))
    } else if (filters.status === 'checkout') {
      result = result.filter((h) => h.hospedagens.some((hosp) => !!hosp.data_checkout))
    }

    if (filters.entradaDe) {
      result = result.filter((h) => h.hospedagens.some((hosp) => hosp.data_entrada >= filters.entradaDe))
    }
    if (filters.entradaAte) {
      result = result.filter((h) => h.hospedagens.some((hosp) => hosp.data_entrada <= filters.entradaAte))
    }
    if (filters.saidaDe) {
      result = result.filter((h) => h.hospedagens.some((hosp) => hosp.data_saida >= filters.saidaDe))
    }
    if (filters.saidaAte) {
      result = result.filter((h) => h.hospedagens.some((hosp) => hosp.data_saida <= filters.saidaAte))
    }

    setFilteredHospedes(result)
  }, [searchTerm, filters, hospedes])

  const loadHospedes = async () => {
    try {
      const { data, error } = await supabase
        .from('pousadajuliana_hospedes')
        .select(`
          *,
          pousadajuliana_hospedagens (
            id,
            hospede_id,
            data_entrada,
            data_saida,
            data_checkin,
            data_checkout,
            fnrh_reserva_id,
            fnrh_hospede_id,
            motivo_viagem_id,
            meio_transporte_id
          )
        `)
        .order('nome_completo')

      if (error) throw error

      const hospedesComHistorico = (data ?? []).map((hospede) => ({
        ...hospede,
        hospedagens: hospede.pousadajuliana_hospedagens ?? [],
      }))

      setHospedes(hospedesComHistorico)
    } catch (error) {
      console.error('Erro ao carregar hóspedes:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyPatch = (fn: (prev: HospedeComHistorico[]) => HospedeComHistorico[]) => {
    setHospedes(fn)
  }

  // ── Edição ────────────────────────────────────────────────────────────────

  const handleEditStart = (hospede: HospedeComHistorico, hosp: Hospedagem, restricted: boolean) => {
    setEditingId(hosp.id)
    setEditingHospedeId(hospede.id)
    setEditRestricted(restricted)
    setEditCidadeEstado(hospede.cidade_estado ?? '')
    setEditForm({
      data_entrada: hosp.data_entrada,
      data_saida: hosp.data_saida,
      motivo_viagem_id: hosp.motivo_viagem_id ?? '',
      meio_transporte_id: hosp.meio_transporte_id ?? '',
      nome_completo: hospede.nome_completo,
      cpf: hospede.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      email: hospede.email,
      telefone: hospede.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
      data_nascimento: toDateInput(hospede.data_nascimento),
      genero_id: hospede.genero_id ?? '',
      raca_id: hospede.raca_id ?? '',
      deficiencia_id: hospede.deficiencia_id ?? '',
      pais_nacionalidade_id: hospede.pais_nacionalidade_id ?? 'BR',
      pais_residencia_id: hospede.pais_residencia_id ?? 'BR',
      cidade_id: hospede.cidade_id ? String(hospede.cidade_id) : '',
      cidade_nome: hospede.cidade_nome ?? '',
    })
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingHospedeId(null)
    setEditRestricted(false)
    setEditCidadeEstado('')
    setEditForm(EMPTY_EDIT)
  }

  const handleEditSave = async (hospedagem: Hospedagem) => {
    // ── Edição restrita (pós check-in): só data de saída ──────────────────
    if (editRestricted) {
      if (!editForm.data_saida) {
        alert('Preencha a data de saída.')
        return
      }
      if (new Date(hospedagem.data_entrada) >= new Date(editForm.data_saida)) {
        alert('A data de saída deve ser posterior à data de entrada.')
        return
      }
      setEditSavingId(hospedagem.id)
      try {
        const { error } = await supabase
          .from('pousadajuliana_hospedagens')
          .update({ data_saida: editForm.data_saida })
          .eq('id', hospedagem.id)
        if (error) throw error
        applyPatch((prev) =>
          prev.map((h) => ({
            ...h,
            hospedagens: h.hospedagens.map((hosp) =>
              hosp.id !== hospedagem.id ? hosp : { ...hosp, data_saida: editForm.data_saida }
            ),
          }))
        )
        handleEditCancel()
      } catch (error: any) {
        console.error('Erro ao salvar hospedagem:', error)
        alert(`Erro ao salvar:\n${error?.message || 'Tente novamente.'}`)
      } finally {
        setEditSavingId(null)
      }
      return
    }

    // ── Edição completa (pré check-in) ────────────────────────────────────
    if (!editForm.nome_completo.trim()) { alert('Informe o nome completo.'); return }
    if (!editForm.cpf.trim()) { alert('Informe o CPF.'); return }
    if (!editForm.data_nascimento) { alert('Informe a data de nascimento.'); return }
    if (!editForm.data_entrada || !editForm.data_saida) {
      alert('Preencha as datas de entrada e saída.')
      return
    }
    if (new Date(editForm.data_entrada) >= new Date(editForm.data_saida)) {
      alert('A data de saída deve ser posterior à data de entrada.')
      return
    }

    const cpfNums = editForm.cpf.replace(/\D/g, '')
    const telNums = editForm.telefone.replace(/\D/g, '')
    const cidadeIdNum = editForm.cidade_id ? Number(editForm.cidade_id) : null
    const residenteBrasil = isBrasil(editForm.pais_residencia_id)

    setEditSavingId(hospedagem.id)
    try {
      const [{ error: errH }, { error: errHosp }] = await Promise.all([
        supabase
          .from('pousadajuliana_hospedes')
          .update({
            nome_completo: editForm.nome_completo.trim(),
            cpf: cpfNums,
            email: editForm.email.trim(),
            telefone: telNums,
            data_nascimento: editForm.data_nascimento,
            genero_id: editForm.genero_id || null,
            raca_id: editForm.raca_id || null,
            deficiencia_id: editForm.deficiencia_id || null,
            pais_nacionalidade_id: editForm.pais_nacionalidade_id || null,
            pais_residencia_id: editForm.pais_residencia_id || null,
            cidade_id: residenteBrasil ? cidadeIdNum : null,
            cidade_nome: residenteBrasil ? null : (editForm.cidade_nome || null),
            cidade_estado: residenteBrasil ? (editCidadeEstado || null) : null,
          })
          .eq('id', editingHospedeId!),
        supabase
          .from('pousadajuliana_hospedagens')
          .update({
            data_entrada: editForm.data_entrada,
            data_saida: editForm.data_saida,
            motivo_viagem_id: editForm.motivo_viagem_id || null,
            meio_transporte_id: editForm.meio_transporte_id || null,
          })
          .eq('id', hospedagem.id),
      ])

      if (errH) throw errH
      if (errHosp) throw errHosp

      applyPatch((prev) =>
        prev.map((h) => {
          if (h.id !== editingHospedeId) return h
          return {
            ...h,
            nome_completo: editForm.nome_completo.trim(),
            cpf: cpfNums,
            email: editForm.email.trim(),
            telefone: telNums,
            data_nascimento: editForm.data_nascimento,
            genero_id: editForm.genero_id || undefined,
            raca_id: editForm.raca_id || undefined,
            deficiencia_id: editForm.deficiencia_id || undefined,
            pais_nacionalidade_id: editForm.pais_nacionalidade_id || undefined,
            pais_residencia_id: editForm.pais_residencia_id || undefined,
            cidade_id: residenteBrasil ? (cidadeIdNum ?? undefined) : undefined,
            cidade_nome: residenteBrasil ? undefined : (editForm.cidade_nome || undefined),
            cidade_estado: residenteBrasil ? (editCidadeEstado || undefined) : undefined,
            hospedagens: h.hospedagens.map((hosp) =>
              hosp.id !== hospedagem.id
                ? hosp
                : {
                    ...hosp,
                    data_entrada: editForm.data_entrada,
                    data_saida: editForm.data_saida,
                    motivo_viagem_id: editForm.motivo_viagem_id || undefined,
                    meio_transporte_id: editForm.meio_transporte_id || undefined,
                  }
            ),
          }
        })
      )

      handleEditCancel()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert(`Erro ao salvar:\n${error?.message || 'Tente novamente.'}`)
    } finally {
      setEditSavingId(null)
    }
  }

  // ── Check-in ──────────────────────────────────────────────────────────────

  const handleCheckin = async (hospede: HospedeComHistorico, hospedagem: Hospedagem) => {
    if (!hospedagem.motivo_viagem_id || !hospedagem.meio_transporte_id) {
      alert('Hospedagem sem motivo de viagem ou meio de transporte. Edite a reserva antes de confirmar o check-in.')
      return
    }

    setCheckinLoadingId(hospedagem.id)
    const checkinEm = new Date().toISOString()

    try {
      const pessoaId = await criarOuObterPessoa({
        nome: hospede.nome_completo,
        cpf: hospede.cpf,
        dataNascimento: hospede.data_nascimento,
        email: hospede.email,
        telefone: hospede.telefone,
        generoId: hospede.genero_id,
        racaId: hospede.raca_id,
        deficienciaId: hospede.deficiencia_id,
        paisNacionalidadeId: hospede.pais_nacionalidade_id,
        paisResidenciaId: hospede.pais_residencia_id,
        cidadeId: hospede.cidade_id,
        estadoId: hospede.cidade_estado,
      })

      const reservaId = await criarReserva({
        cpf: hospede.cpf,
        dataEntrada: hospedagem.data_entrada,
        dataSaida: hospedagem.data_saida,
      })

      const fnrhHospedeId = await adicionarHospedeNaReserva({
        reservaId,
        pessoaId,
        motivoViagemId: hospedagem.motivo_viagem_id!,
        meioTransporteId: hospedagem.meio_transporte_id!,
      })

      console.log('[checkin] IDs FNRH obtidos', { pessoaId, reservaId, fnrhHospedeId })

      const [
        { error: errH },
        { data: hospSalva, error: errHosp },
      ] = await Promise.all([
        supabase
          .from('pousadajuliana_hospedes')
          .update({ fnrh_pessoa_id: pessoaId })
          .eq('id', hospede.id),
        supabase
          .from('pousadajuliana_hospedagens')
          .update({ fnrh_reserva_id: reservaId, fnrh_hospede_id: fnrhHospedeId, data_checkin: checkinEm })
          .eq('id', hospedagem.id)
          .select('id'),
      ])

      if (errH) throw errH
      if (errHosp) throw errHosp
      if (!hospSalva || hospSalva.length === 0) {
        throw new Error('Check-in registrado na FNRH, mas não foi possível salvar no banco de dados. Verifique as políticas RLS do Supabase (UPDATE em pousadajuliana_hospedagens).')
      }

      applyPatch((prev) =>
        prev.map((h) => {
          if (h.id !== hospede.id) return h
          return {
            ...h,
            fnrh_pessoa_id: pessoaId,
            hospedagens: h.hospedagens.map((hosp) =>
              hosp.id !== hospedagem.id
                ? hosp
                : { ...hosp, fnrh_reserva_id: reservaId, fnrh_hospede_id: fnrhHospedeId, data_checkin: checkinEm }
            ),
          }
        })
      )
    } catch (error: any) {
      console.error('Erro no check-in FNRH:', error)
      alert(`Erro ao registrar check-in na FNRH:\n${error?.message || 'Tente novamente.'}`)
    } finally {
      setCheckinLoadingId(null)
    }
  }

  // ── Check-out ─────────────────────────────────────────────────────────────

  const handleCheckout = async (hospedagem: Hospedagem) => {
    if (!hospedagem.fnrh_hospede_id) return
    setCheckoutLoadingId(hospedagem.id)
    const checkoutEm = new Date().toISOString()

    try {
      await enviarCheckout(hospedagem.fnrh_hospede_id)

      const { error } = await supabase
        .from('pousadajuliana_hospedagens')
        .update({ data_checkout: checkoutEm })
        .eq('id', hospedagem.id)

      if (error) throw error

      applyPatch((prev) =>
        prev.map((h) => ({
          ...h,
          hospedagens: h.hospedagens.map((hosp) =>
            hosp.id !== hospedagem.id ? hosp : { ...hosp, data_checkout: checkoutEm }
          ),
        }))
      )
    } catch (error: any) {
      console.error('Erro no check-out FNRH:', error)
      alert(`Erro ao registrar check-out na FNRH:\n${error?.message || 'Tente novamente.'}`)
    } finally {
      setCheckoutLoadingId(null)
    }
  }

  // ── Quartos ───────────────────────────────────────────────────────────────

  const loadQuartos = async () => {
    setQuartosLoading(true)
    try {
      const [{ data: quartosData, error: quartosError }, { data: hospData }] = await Promise.all([
        supabase.from('pousadajuliana_quartos').select('*').order('numero'),
        supabase
          .from('pousadajuliana_hospedagens')
          .select('quarto_id, data_entrada, fnrh_hospede_id')
          .is('data_checkout', null)
          .not('quarto_id', 'is', null),
      ])
      if (quartosError) throw quartosError

      const hospMap: Record<string, HospAtiva[]> = {}
      for (const h of hospData ?? []) {
        if (!h.quarto_id) continue
        if (!hospMap[h.quarto_id]) hospMap[h.quarto_id] = []
        hospMap[h.quarto_id].push({ data_entrada: h.data_entrada, fnrh_hospede_id: h.fnrh_hospede_id ?? null })
      }

      setQuartos(quartosData ?? [])
      setQuartoHospedagensAtivas(hospMap)
    } catch (err) {
      console.error('Erro ao carregar quartos:', err)
    } finally {
      setQuartosLoading(false)
    }
  }

  const handleToggleQuarto = async (quarto: Quarto) => {
    setTogglingId(quarto.id)
    try {
      const { error } = await supabase
        .from('pousadajuliana_quartos')
        .update({ ativo: !quarto.ativo })
        .eq('id', quarto.id)
      if (error) throw error
      setQuartos((prev) =>
        prev.map((q) => (q.id === quarto.id ? { ...q, ativo: !quarto.ativo } : q))
      )
    } catch (err: any) {
      alert(`Erro ao atualizar quarto:\n${err?.message || 'Tente novamente.'}`)
    } finally {
      setTogglingId(null)
    }
  }

  // ── Usuários ──────────────────────────────────────────────────────────────

  const loadUsuarios = async () => {
    setUsuariosLoading(true)
    try {
      const { data, error } = await supabase
        .from('pousadajuliana_administradores')
        .select('id, nome, usuario, perfil, ativo')
        .order('nome')
      if (error) throw error
      setUsuarios(data ?? [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setUsuariosLoading(false)
    }
  }

  const abrirModalCriar = () => {
    setUsuarioForm({ nome: '', usuario: '', senha: '', perfil: 'funcionario' })
    setUsuarioFormErrors({})
    setUsuarioEditando(null)
    setUsuarioModal('criar')
  }

  const abrirModalEditar = (u: Administrador) => {
    setUsuarioForm({ nome: u.nome, usuario: u.usuario, senha: '', perfil: u.perfil ?? 'funcionario' })
    setUsuarioFormErrors({})
    setUsuarioEditando(u)
    setUsuarioModal('editar')
  }

  const fecharModal = () => {
    setUsuarioModal(null)
    setUsuarioEditando(null)
  }

  const validarUsuarioForm = (isCriar: boolean) => {
    const erros: Record<string, string> = {}
    if (!usuarioForm.nome.trim()) erros.nome = 'Nome obrigatório'
    if (!usuarioForm.usuario.trim()) erros.usuario = 'Usuário obrigatório'
    if (isCriar && !usuarioForm.senha) erros.senha = 'Senha obrigatória'
    if (!usuarioForm.perfil) erros.perfil = 'Perfil obrigatório'
    setUsuarioFormErrors(erros)
    return Object.keys(erros).length === 0
  }

  const handleSalvarUsuario = async () => {
    const isCriar = usuarioModal === 'criar'
    if (!validarUsuarioForm(isCriar)) return
    setUsuarioSaving(true)
    try {
      if (isCriar) {
        const { data, error } = await supabase
          .from('pousadajuliana_administradores')
          .insert({ nome: usuarioForm.nome.trim(), usuario: usuarioForm.usuario.trim(), senha: usuarioForm.senha, perfil: usuarioForm.perfil, ativo: true })
          .select('id, nome, usuario, perfil, ativo')
          .single()
        if (error) throw error
        setUsuarios((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      } else {
        const updates: Record<string, unknown> = {
          nome: usuarioForm.nome.trim(),
          usuario: usuarioForm.usuario.trim(),
          perfil: usuarioForm.perfil,
        }
        if (usuarioForm.senha) updates.senha = usuarioForm.senha
        const { error } = await supabase
          .from('pousadajuliana_administradores')
          .update(updates)
          .eq('id', usuarioEditando!.id)
        if (error) throw error
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id !== usuarioEditando!.id
              ? u
              : { ...u, nome: usuarioForm.nome.trim(), usuario: usuarioForm.usuario.trim(), perfil: usuarioForm.perfil }
          )
        )
      }
      fecharModal()
    } catch (err: any) {
      if (err?.code === '23505') {
        setUsuarioFormErrors({ usuario: 'Nome de usuário já existe' })
      } else {
        alert(`Erro ao salvar usuário:\n${err?.message || 'Tente novamente.'}`)
      }
    } finally {
      setUsuarioSaving(false)
    }
  }

  const handleToggleUsuario = async (u: Administrador) => {
    if (u.id === admin.id) return
    setUsuarioTogglingId(u.id)
    try {
      const { error } = await supabase
        .from('pousadajuliana_administradores')
        .update({ ativo: !u.ativo })
        .eq('id', u.id)
      if (error) throw error
      setUsuarios((prev) =>
        prev.map((item) => (item.id !== u.id ? item : { ...item, ativo: !u.ativo }))
      )
    } catch (err: any) {
      alert(`Erro ao atualizar usuário:\n${err?.message || 'Tente novamente.'}`)
    } finally {
      setUsuarioTogglingId(null)
    }
  }

  // ── Utilitários ───────────────────────────────────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem('admin_logado')
    navigate('/login-admin')
  }

  const exportToCSV = () => {
    if (hospedes.length === 0) { alert('Não há dados para exportar'); return }

    const rows: string[][] = [[
      'Nome Completo', 'CPF', 'Email', 'Telefone',
      'Data Nascimento', 'Data Cadastro',
      'Total Hospedagens', 'Última Entrada', 'Última Saída', 'FNRH Pessoa ID',
    ]]

    hospedes.forEach((hospede) => {
      const ultima = [...hospede.hospedagens].sort(
        (a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
      )[0]
      rows.push([
        hospede.nome_completo,
        hospede.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
        hospede.email,
        hospede.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
        new Date(hospede.data_nascimento).toLocaleDateString('pt-BR'),
        new Date(hospede.data_cadastro).toLocaleDateString('pt-BR'),
        String(hospede.hospedagens.length),
        ultima ? new Date(ultima.data_entrada).toLocaleDateString('pt-BR') : '',
        ultima ? new Date(ultima.data_saida).toLocaleDateString('pt-BR') : '',
        hospede.fnrh_pessoa_id ?? '',
      ])
    })

    const csv = rows.map((r) => r.map((f) => `"${f}"`).join(',')).join('\n')
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `hospedes_pousada_juliana_${new Date().toISOString().split('T')[0]}.csv`,
      style: 'visibility:hidden',
    })
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCPF = (v: string) => v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  const formatPhone = (v: string) => v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')

  const formatDate = (date: string) => {
    if (!date) return ''
    if (date.includes('T') || date.includes('+')) return new Date(date).toLocaleDateString('pt-BR')
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = date.split('-')
      return `${d}/${m}/${y}`
    }
    return date
  }

  const formatDateTime = (date: string) =>
    date ? new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''

  const motivoLabel = (id?: string) =>
    motivosViagem.find((m) => m.id === id)?.label ?? id ?? '—'

  const meioLabel = (id?: string) =>
    meiosTransporte.find((m) => m.id === id)?.label ?? id ?? '—'

  const motivoOptions = motivosViagem.map((m) => ({ value: m.id, label: m.label }))
  const meioOptions = meiosTransporte.map((m) => ({ value: m.id, label: m.label }))

  const dateInputClass =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

  // ── Render ────────────────────────────────────────────────────────────────

  if (!admin) return null

  return (
    <Layout
      title="Painel Administrativo"
      headerRight={
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            Olá, <strong>{admin.nome}</strong>
          </span>
          <Button onClick={handleLogout} variant="secondary" icon={LogOut} size="sm">
            Sair
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Resumo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600">
            {filteredHospedes.length} hóspede{filteredHospedes.length !== 1 ? 's' : ''}
            {filteredHospedes.length !== hospedes.length && ` de ${hospedes.length}`}
            {' '}cadastrado{filteredHospedes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Controles e filtros */}
        {(() => {
          const hasActiveFilters =
            searchTerm !== '' ||
            filters.status !== '' ||
            filters.entradaDe !== '' ||
            filters.entradaAte !== '' ||
            filters.saidaDe !== '' ||
            filters.saidaAte !== ''

          const statusButtons: { value: StatusFnrh; label: string }[] = [
            { value: '', label: 'Todos' },
            { value: 'pendente', label: 'Pendente' },
            { value: 'checkin', label: 'Check-in Realizado' },
            { value: 'checkout', label: 'Check-out Realizado' },
          ]

          const dateInputCls =
            'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

          return (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              {/* Linha 1: busca + exportar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Buscar por nome, email ou CPF…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      icon={FilterX}
                      onClick={() => { setSearchTerm(''); setFilters(EMPTY_FILTERS) }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                  <Button onClick={exportToCSV} variant="success" icon={Download}>Exportar CSV</Button>
                </div>
              </div>

              {/* Linha 2: status FNRH */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 shrink-0">Status FNRH:</span>
                {statusButtons.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, status: value }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      filters.status === value
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-sky-400 hover:text-sky-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Linha 3: filtros de data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Entrada — de</label>
                  <input
                    type="date"
                    value={filters.entradaDe}
                    onChange={(e) => setFilters((f) => ({ ...f, entradaDe: e.target.value }))}
                    className={dateInputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Entrada — até</label>
                  <input
                    type="date"
                    value={filters.entradaAte}
                    min={filters.entradaDe}
                    onChange={(e) => setFilters((f) => ({ ...f, entradaAte: e.target.value }))}
                    className={dateInputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Saída — de</label>
                  <input
                    type="date"
                    value={filters.saidaDe}
                    onChange={(e) => setFilters((f) => ({ ...f, saidaDe: e.target.value }))}
                    className={dateInputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Saída — até</label>
                  <input
                    type="date"
                    value={filters.saidaAte}
                    min={filters.saidaDe}
                    onChange={(e) => setFilters((f) => ({ ...f, saidaAte: e.target.value }))}
                    className={dateInputCls}
                  />
                </div>
              </div>
            </div>
          )
        })()}

        {/* Quartos — visível apenas para perfil admin */}
        {admin.perfil === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="h-5 w-5 text-sky-500" />
              <h3 className="text-lg font-semibold text-gray-800">Quartos</h3>
            </div>

            {quartosLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500" />
                Carregando quartos…
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(() => {
                  const hoje = new Date().toISOString().split('T')[0]
                  const statusCfg: Record<StatusQuarto, { border: string; bg: string; badge: string; label: string }> = {
                    disponivel: { border: 'border-emerald-200', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Disponível' },
                    reservado:  { border: 'border-yellow-200',  bg: 'bg-yellow-50',  badge: 'bg-yellow-100 text-yellow-700',  label: 'Reservado' },
                    ocupado:    { border: 'border-red-200',     bg: 'bg-red-50',     badge: 'bg-red-100 text-red-700',        label: 'Ocupado' },
                    inativo:    { border: 'border-gray-200',    bg: 'bg-gray-50',    badge: 'bg-gray-200 text-gray-500',      label: 'Inativo' },
                  }
                  return quartos.map((quarto) => {
                    const hosps = quartoHospedagensAtivas[quarto.id] ?? []
                    const status = calcularStatusQuarto(quarto, hosps, hoje)
                    const cfg = statusCfg[status]
                    const podeToggle = status === 'disponivel' || status === 'inativo'
                    return (
                      <div
                        key={quarto.id}
                        className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${cfg.bg} ${cfg.border}`}
                      >
                        <span className="text-sm font-semibold text-gray-800">
                          Quarto {quarto.numero}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {podeToggle && (
                          <button
                            type="button"
                            disabled={togglingId === quarto.id}
                            onClick={() => handleToggleQuarto(quarto)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                              status === 'disponivel'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {togglingId === quarto.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-b border-current" />
                            ) : status === 'disponivel' ? (
                              <ToggleRight className="h-3.5 w-3.5" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                            {status === 'disponivel' ? 'Desativar' : 'Ativar'}
                          </button>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        )}

        {/* Usuários — visível apenas para perfil admin */}
        {admin.perfil === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-sky-500" />
                <h3 className="text-lg font-semibold text-gray-800">Usuários</h3>
              </div>
              <Button size="sm" variant="primary" icon={UserPlus} onClick={abrirModalCriar}>
                Novo Usuário
              </Button>
            </div>

            {usuariosLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500" />
                Carregando usuários…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Nome', 'Usuário', 'Perfil', 'Status', 'Ações'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usuarios.map((u) => {
                      const ehProprio = u.id === admin.id
                      const isToggling = usuarioTogglingId === u.id
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.nome}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{u.usuario}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.perfil === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}>
                              {u.perfil === 'admin' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                              {u.perfil === 'admin' ? 'Administrador' : 'Funcionário'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.ativo !== false
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {u.ativo !== false ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Pencil}
                                onClick={() => abrirModalEditar(u)}
                              >
                                Editar
                              </Button>
                              <button
                                type="button"
                                disabled={ehProprio || isToggling}
                                title={ehProprio ? 'Você não pode se desativar' : undefined}
                                onClick={() => handleToggleUsuario(u)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                  u.ativo !== false
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {isToggling ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-b border-current" />
                                ) : u.ativo !== false ? (
                                  <ToggleRight className="h-3.5 w-3.5" />
                                ) : (
                                  <ToggleLeft className="h-3.5 w-3.5" />
                                )}
                                {u.ativo !== false ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {usuarios.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">Nenhum usuário encontrado</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Usuário */}
        {usuarioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">
                  {usuarioModal === 'criar' ? 'Novo Usuário' : 'Editar Usuário'}
                </h3>
                <button type="button" onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={usuarioForm.nome}
                    onChange={(e) => setUsuarioForm((f) => ({ ...f, nome: e.target.value }))}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                      usuarioFormErrors.nome ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                    }`}
                    placeholder="Nome completo"
                  />
                  {usuarioFormErrors.nome && <p className="text-xs text-red-500">{usuarioFormErrors.nome}</p>}
                </div>

                {/* Usuário */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Usuário</label>
                  <input
                    type="text"
                    value={usuarioForm.usuario}
                    onChange={(e) => setUsuarioForm((f) => ({ ...f, usuario: e.target.value }))}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                      usuarioFormErrors.usuario ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                    }`}
                    placeholder="login de acesso"
                    autoComplete="off"
                  />
                  {usuarioFormErrors.usuario && <p className="text-xs text-red-500">{usuarioFormErrors.usuario}</p>}
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Senha {usuarioModal === 'editar' && <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>}
                  </label>
                  <input
                    type="password"
                    value={usuarioForm.senha}
                    onChange={(e) => setUsuarioForm((f) => ({ ...f, senha: e.target.value }))}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                      usuarioFormErrors.senha ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                    }`}
                    placeholder={usuarioModal === 'editar' ? '••••••••' : 'Senha de acesso'}
                    autoComplete="new-password"
                  />
                  {usuarioFormErrors.senha && <p className="text-xs text-red-500">{usuarioFormErrors.senha}</p>}
                </div>

                {/* Perfil */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Perfil</label>
                  <select
                    value={usuarioForm.perfil}
                    onChange={(e) => setUsuarioForm((f) => ({ ...f, perfil: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {usuarioFormErrors.perfil && <p className="text-xs text-red-500">{usuarioFormErrors.perfil}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                <Button size="sm" variant="secondary" icon={X} onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button size="sm" variant="primary" icon={Save} loading={usuarioSaving} onClick={handleSalvarUsuario}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto" />
            <p className="text-gray-500 mt-2">Carregando hóspedes…</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Hóspede', 'Contato', 'Nascimento', 'Cadastro', 'FNRH', 'Hospedagens'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHospedes.map((hospede) => {
                    const isExpanded = expandedId === hospede.id
                    const hospedagensOrdenadas = [...hospede.hospedagens].sort(
                      (a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
                    )

                    return (
                      <React.Fragment key={hospede.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() => setExpandedId(isExpanded ? null : hospede.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-5 w-5 text-sky-500" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{hospede.nome_completo}</div>
                                <div className="text-sm text-gray-500">CPF: {formatCPF(hospede.cpf)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{hospede.email}</div>
                            <div className="text-sm text-gray-500">{formatPhone(hospede.telefone)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(hospede.data_nascimento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(hospede.data_cadastro)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hospede.fnrh_pessoa_id ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <CheckCircle className="h-3 w-3" /> Registrado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                <AlertCircle className="h-3 w-3" /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                  {hospede.hospedagens.length} hospedagem{hospede.hospedagens.length !== 1 ? 'ns' : ''}
                                </div>
                                {hospedagensOrdenadas[0] && (
                                  <div className="text-xs text-gray-500">
                                    Última: {formatDate(hospedagensOrdenadas[0].data_entrada)}
                                  </div>
                                )}
                              </div>
                              {hospede.hospedagens.length > 0 && (
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-sky-50 px-6 py-4">
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-2">
                                  Histórico de Hospedagens
                                </p>

                                {hospedagensOrdenadas.map((hosp) => {
                                  const isEditing = editingId === hosp.id
                                  const isSavingEdit = editSavingId === hosp.id
                                  const isLoadingCheckin = checkinLoadingId === hosp.id
                                  const isLoadingCheckout = checkoutLoadingId === hosp.id
                                  const checkinFeito = !!hosp.fnrh_hospede_id
                                  const checkoutFeito = !!hosp.data_checkout
                                  const podeEditar = !checkoutFeito && !isEditing
                                  const podeCheckin = !checkinFeito
                                  const podeCheckout = !!hosp.fnrh_reserva_id && checkinFeito && !checkoutFeito

                                  // ── Formulário de edição ───────────────
                                  if (isEditing) {
                                    return (
                                      <div
                                        key={hosp.id}
                                        className="bg-white rounded-lg border-2 border-amber-200 px-5 py-5"
                                      >
                                        <div className="flex items-center justify-between mb-5">
                                          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
                                            <Pencil className="h-3.5 w-3.5" />
                                            {editRestricted ? 'Editar Data de Saída' : 'Editar Hóspede e Reserva'}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={handleEditCancel}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>

                                        {editRestricted ? (
                                          /* ── Edição restrita: só data de saída ── */
                                          <div className="max-w-xs space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">Data de Saída</label>
                                            <input
                                              type="date"
                                              value={editForm.data_saida}
                                              min={editForm.data_entrada}
                                              onChange={(e) => setEditForm((f) => ({ ...f, data_saida: e.target.value }))}
                                              className={dateInputClass}
                                            />
                                          </div>
                                        ) : (
                                          /* ── Edição completa ── */
                                          <div className="space-y-5">

                                            {/* Seção: Dados do Hóspede */}
                                            <div>
                                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                                Dados do Hóspede
                                              </p>
                                              <div className="grid sm:grid-cols-2 gap-3">

                                                {/* Nome */}
                                                <div className="sm:col-span-2 space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                                  <input
                                                    type="text"
                                                    value={editForm.nome_completo}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, nome_completo: e.target.value }))}
                                                    className={dateInputClass}
                                                  />
                                                </div>

                                                {/* CPF */}
                                                <div className="space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">CPF</label>
                                                  <input
                                                    type="text"
                                                    value={editForm.cpf}
                                                    onChange={(e) => {
                                                      const n = e.target.value.replace(/\D/g, '').slice(0, 11)
                                                      setEditForm((f) => ({
                                                        ...f,
                                                        cpf: n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
                                                      }))
                                                    }}
                                                    className={dateInputClass}
                                                    placeholder="000.000.000-00"
                                                  />
                                                </div>

                                                {/* Data de Nascimento */}
                                                <div className="space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                                                  <input
                                                    type="date"
                                                    value={editForm.data_nascimento}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, data_nascimento: e.target.value }))}
                                                    className={dateInputClass}
                                                  />
                                                </div>

                                                {/* Email */}
                                                <div className="sm:col-span-2 space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Email</label>
                                                  <input
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                                    className={dateInputClass}
                                                  />
                                                </div>

                                                {/* Telefone */}
                                                <div className="space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                                  <input
                                                    type="text"
                                                    value={editForm.telefone}
                                                    onChange={(e) => {
                                                      const n = e.target.value.replace(/\D/g, '').slice(0, 11)
                                                      setEditForm((f) => ({
                                                        ...f,
                                                        telefone: n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
                                                      }))
                                                    }}
                                                    className={dateInputClass}
                                                    placeholder="(00) 00000-0000"
                                                  />
                                                </div>

                                                {/* Gênero */}
                                                <Select
                                                  label="Gênero"
                                                  value={editForm.genero_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, genero_id: e.target.value }))}
                                                  options={GENEROS}
                                                  placeholder="Selecione"
                                                />

                                                {/* Raça/Etnia */}
                                                <Select
                                                  label="Raça/Etnia"
                                                  value={editForm.raca_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, raca_id: e.target.value }))}
                                                  options={RACAS}
                                                  placeholder="Selecione"
                                                />

                                                {/* Deficiência */}
                                                <Select
                                                  label="Possui deficiência"
                                                  value={editForm.deficiencia_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, deficiencia_id: e.target.value }))}
                                                  options={DEFICIENCIAS}
                                                  placeholder="Selecione"
                                                />

                                                {/* País de Nacionalidade */}
                                                <Select
                                                  label="País de Nacionalidade"
                                                  value={editForm.pais_nacionalidade_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, pais_nacionalidade_id: e.target.value }))}
                                                  options={PAIS_OPTIONS}
                                                  placeholder="Selecione"
                                                />

                                                {/* País de Residência */}
                                                <Select
                                                  label="País de Residência"
                                                  value={editForm.pais_residencia_id}
                                                  onChange={(e) => {
                                                    const pais = e.target.value
                                                    setEditForm((f) => ({
                                                      ...f,
                                                      pais_residencia_id: pais,
                                                      cidade_id: '',
                                                      cidade_nome: '',
                                                    }))
                                                    setEditCidadeEstado('')
                                                  }}
                                                  options={PAIS_OPTIONS}
                                                  placeholder="Selecione"
                                                />

                                                {/* Cidade */}
                                                <div className="sm:col-span-2">
                                                  {isBrasil(editForm.pais_residencia_id) ? (
                                                    <CidadeAutocomplete
                                                      value={editForm.cidade_id}
                                                      onChange={(ibge, estado) => {
                                                        setEditForm((f) => ({ ...f, cidade_id: ibge, cidade_nome: '' }))
                                                        setEditCidadeEstado(estado)
                                                      }}
                                                    />
                                                  ) : (
                                                    <div className="space-y-1">
                                                      <label className="block text-sm font-medium text-gray-700">Cidade de Residência</label>
                                                      <input
                                                        type="text"
                                                        value={editForm.cidade_nome}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, cidade_nome: e.target.value, cidade_id: '' }))}
                                                        className={dateInputClass}
                                                        placeholder="Nome da cidade"
                                                      />
                                                    </div>
                                                  )}
                                                </div>

                                              </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-gray-100" />

                                            {/* Seção: Dados da Reserva */}
                                            <div>
                                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                                Dados da Reserva
                                              </p>
                                              <div className="grid sm:grid-cols-2 gap-3">

                                                {/* Data de Entrada */}
                                                <div className="space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Data de Entrada</label>
                                                  <input
                                                    type="date"
                                                    value={editForm.data_entrada}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, data_entrada: e.target.value }))}
                                                    className={dateInputClass}
                                                  />
                                                </div>

                                                {/* Data de Saída */}
                                                <div className="space-y-1">
                                                  <label className="block text-sm font-medium text-gray-700">Data de Saída</label>
                                                  <input
                                                    type="date"
                                                    value={editForm.data_saida}
                                                    min={editForm.data_entrada}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, data_saida: e.target.value }))}
                                                    className={dateInputClass}
                                                  />
                                                </div>

                                                {/* Motivo da Viagem */}
                                                <Select
                                                  label="Motivo da Viagem"
                                                  value={editForm.motivo_viagem_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, motivo_viagem_id: e.target.value }))}
                                                  options={motivoOptions}
                                                  placeholder={motivoOptions.length === 0 ? 'Carregando…' : 'Selecione'}
                                                  disabled={motivoOptions.length === 0}
                                                />

                                                {/* Meio de Transporte */}
                                                <Select
                                                  label="Meio de Transporte"
                                                  value={editForm.meio_transporte_id}
                                                  onChange={(e) => setEditForm((f) => ({ ...f, meio_transporte_id: e.target.value }))}
                                                  options={meioOptions}
                                                  placeholder={meioOptions.length === 0 ? 'Carregando…' : 'Selecione'}
                                                  disabled={meioOptions.length === 0}
                                                />

                                              </div>
                                            </div>

                                          </div>
                                        )}

                                        {/* Ações */}
                                        <div className="flex justify-end gap-2 mt-5">
                                          <Button size="sm" variant="secondary" icon={X} onClick={handleEditCancel}>
                                            Cancelar
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            icon={Save}
                                            loading={isSavingEdit}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditSave(hosp)
                                            }}
                                          >
                                            Salvar
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  }

                                  // ── Card da hospedagem ─────────────────
                                  return (
                                    <div
                                      key={hosp.id}
                                      className="bg-white rounded-lg border border-sky-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                                    >
                                      {/* Info */}
                                      <div className="flex items-center gap-4 text-sm flex-wrap">
                                        <div>
                                          <span className="text-gray-500 text-xs">Entrada</span>
                                          <p className="font-medium text-gray-800">{formatDate(hosp.data_entrada)}</p>
                                        </div>
                                        <div className="text-gray-300">→</div>
                                        <div>
                                          <span className="text-gray-500 text-xs">Saída prev.</span>
                                          <p className="font-medium text-gray-800">{formatDate(hosp.data_saida)}</p>
                                        </div>

                                        {(hosp.motivo_viagem_id || hosp.meio_transporte_id) && (
                                          <>
                                            <div className="text-gray-300">|</div>
                                            <div>
                                              <span className="text-gray-500 text-xs">Motivo</span>
                                              <p className="text-gray-700 text-xs">{motivoLabel(hosp.motivo_viagem_id)}</p>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 text-xs">Transporte</span>
                                              <p className="text-gray-700 text-xs">{meioLabel(hosp.meio_transporte_id)}</p>
                                            </div>
                                          </>
                                        )}

                                        {checkinFeito && hosp.data_checkin && (
                                          <>
                                            <div className="text-gray-300">|</div>
                                            <div>
                                              <span className="text-gray-500 text-xs">Check-in FNRH</span>
                                              <p className="font-medium text-gray-800">{formatDateTime(hosp.data_checkin)}</p>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Badges e ações */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {checkinFeito && (
                                          <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                                            <CheckCircle className="h-3 w-3" />
                                            Check-in Realizado · {formatDateTime(hosp.data_checkin!)}
                                          </span>
                                        )}

                                        {checkoutFeito && (
                                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                            <CheckCircle className="h-3 w-3" />
                                            Check-out Realizado · {formatDateTime(hosp.data_checkout!)}
                                          </span>
                                        )}

                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          icon={Printer}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setFichaHospedeId(hospede.id)
                                            setFichaHospedagemId(hosp.id)
                                          }}
                                        >
                                          Imprimir Ficha
                                        </Button>

                                        {podeEditar && (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            icon={Pencil}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditStart(hospede, hosp, checkinFeito)
                                            }}
                                          >
                                            Editar
                                          </Button>
                                        )}

                                        {podeCheckin && (
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            icon={LogIn}
                                            loading={isLoadingCheckin}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCheckin(hospede, hosp)
                                            }}
                                          >
                                            Confirmar Check-in
                                          </Button>
                                        )}

                                        {podeCheckout && (
                                          <Button
                                            size="sm"
                                            variant="warning"
                                            icon={LogOutIcon}
                                            loading={isLoadingCheckout}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCheckout(hosp)
                                            }}
                                          >
                                            Confirmar Check-out
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredHospedes.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum hóspede encontrado' : 'Nenhum hóspede cadastrado'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {fichaHospedeId && fichaHospedagemId && (
        <FichaModal
          hospedeId={fichaHospedeId}
          hospedagemId={fichaHospedagemId}
          onClose={() => {
            setFichaHospedeId(null)
            setFichaHospedagemId(null)
          }}
        />
      )}
    </Layout>
  )
}
