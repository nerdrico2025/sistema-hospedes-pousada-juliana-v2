import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

export default function LoginAdmin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    usuario: '',
    senha: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.usuario || !formData.senha) {
      setError('Preencha todos os campos')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('pousadajuliana_administradores')
        .select('*')
        .eq('usuario', formData.usuario)
        .eq('senha', formData.senha)
        .single()
      
      if (error || !data) {
        setError('Usuário ou senha incorretos')
        return
      }
      
      // Salvar autenticação no localStorage
      localStorage.setItem('admin_logado', JSON.stringify({
        id: data.id,
        nome: data.nome,
        usuario: data.usuario
      }))
      
      navigate('/admin')
      
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Acesso Administrativo</h2>
            <p className="text-gray-600 mt-2">Entre com suas credenciais</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <Input
              label="Usuário"
              value={formData.usuario}
              onChange={(e) => setFormData({...formData, usuario: e.target.value})}
              icon={<User className="h-4 w-4 text-gray-400" />}
              placeholder="Digite seu usuário"
            />
            
            <Input
              label="Senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              placeholder="Digite sua senha"
            />
            
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              variant="warning"
            >
              Entrar
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}