import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, LogOut, Users, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { HospedeComHistorico } from '../types'

export default function Admin() {
  const navigate = useNavigate()
  const [hospedes, setHospedes] = useState<HospedeComHistorico[]>([])
  const [filteredHospedes, setFilteredHospedes] = useState<HospedeComHistorico[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    const adminData = localStorage.getItem('admin_logado')
    if (!adminData) {
      navigate('/login-admin')
      return
    }
    
    setAdmin(JSON.parse(adminData))
    loadHospedes()
  }, [navigate])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredHospedes(hospedes)
    } else {
      const filtered = hospedes.filter(hospede => 
        hospede.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospede.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospede.cpf.includes(searchTerm.replace(/\D/g, ''))
      )
      setFilteredHospedes(filtered)
    }
  }, [searchTerm, hospedes])

  const loadHospedes = async () => {
    try {
      const { data, error } = await supabase
        .from('pousadajuliana_hospedes')
        .select(`
          *,
          pousadajuliana_hospedagens (*)
        `)
        .order('nome_completo')
      
      if (error) throw error
      
      const hospedesComHistorico = data?.map(hospede => ({
        ...hospede,
        hospedagens: hospede.pousadajuliana_hospedagens || []
      })) || []
      
      setHospedes(hospedesComHistorico)
      setFilteredHospedes(hospedesComHistorico)
    } catch (error) {
      console.error('Erro ao carregar hóspedes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logado')
    navigate('/login-admin')
  }

  const exportToCSV = () => {
    if (hospedes.length === 0) {
      alert('Não há dados para exportar')
      return
    }

    // Preparar dados para CSV
    const csvData = []
    
    // Cabeçalho
    csvData.push([
      'Nome Completo',
      'CPF',
      'Email',
      'Telefone',
      'Data Nascimento',
      'Data Cadastro',
      'Total Hospedagens',
      'Última Entrada',
      'Última Saída'
    ])
    
    // Dados dos hóspedes
    hospedes.forEach(hospede => {
      const ultimaHospedagem = hospede.hospedagens
        .sort((a, b) => new Date(b.data_checkin).getTime() - new Date(a.data_checkin).getTime())[0]
      
      csvData.push([
        hospede.nome_completo,
        hospede.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
        hospede.email,
        hospede.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
        new Date(hospede.data_nascimento).toLocaleDateString('pt-BR'),
        new Date(hospede.data_cadastro).toLocaleDateString('pt-BR'),
        hospede.hospedagens.length,
        ultimaHospedagem ? new Date(ultimaHospedagem.data_entrada).toLocaleDateString('pt-BR') : '',
        ultimaHospedagem ? new Date(ultimaHospedagem.data_saida).toLocaleDateString('pt-BR') : ''
      ])
    })
    
    // Converter para CSV
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `hospedes_pousada_juliana_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  if (!admin) return null

  return (
    <Layout title="Painel Administrativo">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Bem-vindo, {admin.nome}
              </h3>
              <p className="text-gray-600">
                {hospedes.length} hóspede{hospedes.length !== 1 ? 's' : ''} cadastrado{hospedes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              icon={LogOut}
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Button
              onClick={exportToCSV}
              variant="success"
              icon={Download}
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Lista de hóspedes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando hóspedes...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hóspede
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nascimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hospedagens
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHospedes.map((hospede) => (
                    <tr key={hospede.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-sky-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {hospede.nome_completo}
                            </div>
                            <div className="text-sm text-gray-500">
                              CPF: {formatCPF(hospede.cpf)}
                            </div>
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
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {hospede.hospedagens.length} hospedagem{hospede.hospedagens.length !== 1 ? 'ns' : ''}
                        </div>
                        {hospede.hospedagens.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Última: {formatDate(hospede.hospedagens
                              .sort((a, b) => new Date(b.data_checkin).getTime() - new Date(a.data_checkin).getTime())[0]
                              .data_entrada)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
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
    </Layout>
  )
}