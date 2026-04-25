import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, User, Mail, Phone, MapPin, Save, ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import DateInput from '../components/DateInput'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { NovoHospede } from '../types'

export default function Cadastrar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState<NovoHospede>({
    nome_completo: '',
    cpf: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    data_entrada: '',
    data_saida: ''
  })
  const [errors, setErrors] = useState<Partial<NovoHospede>>({})

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
    let formattedValue = value
    
    if (field === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'telefone') {
      formattedValue = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Partial<NovoHospede> = {}
    
    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome obrigatório'
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email obrigatório'
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone obrigatório'
    if (!formData.data_nascimento) newErrors.data_nascimento = 'Data de nascimento obrigatória'
    if (!formData.data_entrada) newErrors.data_entrada = 'Data de entrada obrigatória'
    if (!formData.data_saida) newErrors.data_saida = 'Data de saída obrigatória'
    
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido'
    }
    
    // Validação de datas - converte para formato ISO se necessário
    const convertToISO = (dateStr: string) => {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      return dateStr
    }
    
    const dataEntradaISO = convertToISO(formData.data_entrada)
    const dataSaidaISO = convertToISO(formData.data_saida)
    
    if (formData.data_entrada && formData.data_saida && 
        new Date(dataEntradaISO) >= new Date(dataSaidaISO)) {
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
      // Função para garantir formato ISO
      const ensureISODate = (dateStr: string) => {
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateStr.split('/')
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return dateStr
      }
      
      // Inserir hóspede
      const { data: hospede, error: hospedeError } = await supabase
        .from('pousadajuliana_hospedes')
        .insert({
          nome_completo: formData.nome_completo,
          cpf: formData.cpf.replace(/\D/g, ''),
          email: formData.email,
          telefone: formData.telefone.replace(/\D/g, ''),
          data_nascimento: ensureISODate(formData.data_nascimento)
        })
        .select()
        .single()
      
      if (hospedeError) throw hospedeError
      
      // Inserir hospedagem
      const { error: hospedagemError } = await supabase
        .from('pousadajuliana_hospedagens')
        .insert({
          hospede_id: hospede.id,
          data_entrada: ensureISODate(formData.data_entrada),
          data_saida: ensureISODate(formData.data_saida)
        })
      
      if (hospedagemError) throw hospedagemError
      
      setShowSuccess(true)
      
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      alert(`Erro ao cadastrar hóspede: ${error.message || 'Tente novamente.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Layout title="Cadastro Realizado com Sucesso!">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-800 mb-2">
              Hóspede Cadastrado!
            </h3>
            <p className="text-emerald-600 mb-6">
              O cadastro de <strong>{formData.nome_completo}</strong> foi realizado com sucesso.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                variant="success"
                className="w-full"
              >
                Voltar ao Início
              </Button>
              <Button
                onClick={() => {
                  setShowSuccess(false)
                  setFormData({
                    nome_completo: '',
                    cpf: '',
                    email: '',
                    telefone: '',
                    data_nascimento: '',
                    data_entrada: '',
                    data_saida: ''
                  })
                }}
                variant="secondary"
                className="w-full"
              >
                Novo Cadastro
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Cadastrar Novo Hóspede">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  error={errors.nome_completo}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <Input
                label="CPF"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                error={errors.cpf}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                placeholder="email@exemplo.com"
              />
              
              <Input
                label="Telefone com DDD"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                error={errors.telefone}
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              
              <DateInput
                label="Data de Nascimento"
                value={formData.data_nascimento}
                onChange={(value) => handleInputChange('data_nascimento', value)}
                error={errors.data_nascimento}
                placeholder="dd/mm/aaaa"
              />
            </div>
            
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
                  min={new Date().toISOString().split('T')[0]}
                />
                
                <DateInput
                  label="Data de Saída"
                  value={formData.data_saida}
                  onChange={(value) => handleInputChange('data_saida', value)}
                  error={errors.data_saida}
                  placeholder="dd/mm/aaaa"
                  min={formData.data_entrada || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="flex space-x-4 pt-6">
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