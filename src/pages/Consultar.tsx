import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, User, Mail, Phone, Calendar, MapPin, Edit, Plus, ArrowLeft, Save, X } from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import DateInput from '../components/DateInput'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { HospedeComHistorico, Hospedagem } from '../types'

export default function Consultar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [hospedes, setHospedes] = useState<HospedeComHistorico[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [showCheckin, setShowCheckin] = useState<string | null>(null)
  const [checkinData, setCheckinData] = useState({ data_entrada: '', data_saida: '' })

  useEffect(() => {
    if (searchParams.get('q')) {
      handleSearch()
    }
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const { data: hospedesData, error } = await supabase
        .from('pousadajuliana_hospedes')
        .select(`
          *,
          pousadajuliana_hospedagens (*)
        `)
        .or(`nome_completo.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('nome_completo')
      
      if (error) throw error
      
      const hospedesComHistorico = hospedesData?.map(hospede => ({
        ...hospede,
        hospedagens: hospede.pousadajuliana_hospedagens || []
      })) || []
      
      setHospedes(hospedesComHistorico)
    } catch (error) {
      console.error('Erro na busca:', error)
      alert('Erro ao buscar hóspedes')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (hospede: HospedeComHistorico) => {
    setEditingId(hospede.id)
    setEditData({
      nome_completo: hospede.nome_completo,
      email: hospede.email,
      telefone: hospede.telefone,
      data_nascimento: hospede.data_nascimento
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pousadajuliana_hospedes')
        .update(editData)
        .eq('id', id)
      
      if (error) throw error
      
      setHospedes(prev => prev.map(h => 
        h.id === id ? { ...h, ...editData } : h
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar alterações')
    }
  }

  const handleCheckin = async (hospedeId: string) => {
    if (!checkinData.data_entrada || !checkinData.data_saida) {
      alert('Preencha as datas de entrada e saída')
      return
    }
    
    if (new Date(checkinData.data_entrada) >= new Date(checkinData.data_saida)) {
      alert('Data de saída deve ser posterior à entrada')
      return
    }
    
    try {
      const { error } = await supabase
        .from('pousadajuliana_hospedagens')
        .insert({
          hospede_id: hospedeId,
          data_entrada: checkinData.data_entrada,
          data_saida: checkinData.data_saida
        })
      
      if (error) throw error
      
      alert('Check-in realizado com sucesso!')
      setShowCheckin(null)
      setCheckinData({ data_entrada: '', data_saida: '' })
      handleSearch() // Recarregar dados
    } catch (error) {
      console.error('Erro no check-in:', error)
      alert('Erro ao realizar check-in')
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    
    // Se é um timestamp completo (ISO 8601)
    if (date.includes('T') || date.includes('+')) {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('pt-BR')
    }
    
    // Se está no formato ISO date (yyyy-mm-dd)
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Se já está formatado ou outro formato
    return date
  }

  return (
    <Layout title="Consultar Hóspedes">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Formulário de busca */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Digite o nome completo ou email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Button
              onClick={handleSearch}
              loading={loading}
              icon={Search}
            >
              Buscar
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              icon={ArrowLeft}
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {hospedes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {hospedes.length} hóspede{hospedes.length > 1 ? 's' : ''} encontrado{hospedes.length > 1 ? 's' : ''}
            </h3>
            
            {hospedes.map((hospede) => (
              <div key={hospede.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {editingId === hospede.id ? (
                          <Input
                            value={editData.nome_completo}
                            onChange={(e) => setEditData({...editData, nome_completo: e.target.value})}
                            className="text-lg font-semibold"
                          />
                        ) : (
                          hospede.nome_completo
                        )}
                      </h4>
                      <p className="text-gray-500">CPF: {formatCPF(hospede.cpf)}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {editingId === hospede.id ? (
                      <>
                        <Button
                          onClick={() => handleSaveEdit(hospede.id)}
                          size="sm"
                          icon={Save}
                        >
                          Salvar
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          size="sm"
                          variant="secondary"
                          icon={X}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleEdit(hospede)}
                          size="sm"
                          variant="secondary"
                          icon={Edit}
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => setShowCheckin(hospede.id)}
                          size="sm"
                          variant="success"
                          icon={Plus}
                        >
                          Check-in
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Dados do hóspede */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {editingId === hospede.id ? (
                      <Input
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="flex-1"
                      />
                    ) : (
                      <span>{hospede.email}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {editingId === hospede.id ? (
                      <Input
                        value={editData.telefone}
                        onChange={(e) => setEditData({...editData, telefone: e.target.value})}
                        className="flex-1"
                      />
                    ) : (
                      <span>{formatPhone(hospede.telefone)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {editingId === hospede.id ? (
                      <DateInput
                        value={editData.data_nascimento}
                        onChange={(value) => setEditData({...editData, data_nascimento: value})}
                        className="flex-1"
                        placeholder="dd/mm/aaaa"
                      />
                    ) : (
                      <span>Nascimento: {formatDate(hospede.data_nascimento)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Cadastro: {formatDate(hospede.data_cadastro)}</span>
                  </div>
                </div>

                {/* Check-in form */}
                {showCheckin === hospede.id && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 text-emerald-500 mr-2" />
                      Novo Check-in
                    </h5>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <DateInput
                        label="Data de Entrada"
                        value={checkinData.data_entrada}
                        onChange={(value) => setCheckinData({...checkinData, data_entrada: value})}
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="dd/mm/aaaa"
                      />
                      <DateInput
                        label="Data de Saída"
                        value={checkinData.data_saida}
                        onChange={(value) => setCheckinData({...checkinData, data_saida: value})}
                        min={checkinData.data_entrada || new Date().toISOString().split('T')[0]}
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleCheckin(hospede.id)}
                        variant="success"
                        size="sm"
                      >
                        Confirmar Check-in
                      </Button>
                      <Button
                        onClick={() => setShowCheckin(null)}
                        variant="secondary"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Histórico de hospedagens */}
                {hospede.hospedagens.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="font-semibold text-gray-800 mb-3">
                      Histórico de Hospedagens ({hospede.hospedagens.length})
                    </h5>
                    <div className="space-y-2">
                      {hospede.hospedagens
                        .sort((a, b) => new Date(b.data_checkin).getTime() - new Date(a.data_checkin).getTime())
                        .map((hospedagem) => (
                        <div key={hospedagem.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-4 text-sm">
                              <span><strong>Entrada:</strong> {formatDate(hospedagem.data_entrada)}</span>
                              <span><strong>Saída:</strong> {formatDate(hospedagem.data_saida)}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Check-in: {formatDate(hospedagem.data_checkin)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Buscando hóspedes...</p>
          </div>
        )}

        {!loading && hospedes.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum hóspede encontrado</p>
          </div>
        )}
      </div>
    </Layout>
  )
}