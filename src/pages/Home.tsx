import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, User } from 'lucide-react'
import Layout from '../components/Layout'
import ActionBox from '../components/ActionBox'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Home() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    
    setSearchLoading(true)
    // Simulate API call delay for better UX
    setTimeout(() => {
      navigate(`/consultar?q=${encodeURIComponent(searchTerm)}`)
      setSearchLoading(false)
    }, 500)
  }

  const handleNewGuest = () => {
    navigate('/cadastrar')
  }

  return (
    <Layout title="Sistema de Cadastro de Hóspedes">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <ActionBox
          title="Consultar Hóspede"
          description="Busque hóspedes cadastrados e faça novos check-ins"
          icon={Search}
          color="blue"
        >
          <form onSubmit={handleSearch}>
            <div className="space-y-4">
              <Input
                placeholder="Digite o nome completo ou email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<User className="h-4 w-4 text-gray-400" />}
              />
              <Button
                type="submit"
                icon={Search}
                loading={searchLoading}
                className="w-full"
                disabled={!searchTerm.trim()}
              >
                Consultar
              </Button>
            </div>
          </form>
        </ActionBox>

        <ActionBox
          title="Cadastrar Novo Hóspede"
          description="Registre um novo hóspede no sistema da pousada"
          icon={UserPlus}
          color="green"
        >
          <div className="space-y-4">
            <div className="text-center text-gray-600">
              <p className="mb-4">Clique para abrir o formulário de cadastro</p>
            </div>
            <Button
              onClick={handleNewGuest}
              icon={UserPlus}
              variant="success"
              className="w-full"
            >
              Novo Cadastro
            </Button>
          </div>
        </ActionBox>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => navigate('/login-admin')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          Acesso Administrativo
        </button>
      </div>
    </Layout>
  )
}