'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import Alert from '@/components/alerts'
import { ArrowLeft, User, Phone, Mail, MapPin } from 'lucide-react'

export default function NovoClientePage() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    email: '',
    endereco: '',
    notas: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      const { error: insertError } = await supabase.from('clientes').insert({
        ...formData,
        usuario_id: userData.user.id,
      })

      if (insertError) throw insertError

      addNotification(`✅ Cliente "${formData.nome}" cadastrado!`, 'success')
      router.push('/dashboard/clientes')
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Cliente</h2>
          <p className="text-gray-500 dark:text-gray-400">Cadastre um novo cliente para controlar fiado</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" />}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Nome *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="input-field pl-10 w-full"
              placeholder="Nome completo do cliente"
              required
            />
          </div>
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="input-field pl-10 w-full"
              placeholder="(21) 99999-9999"
            />
          </div>
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium mb-1.5">CPF (opcional)</label>
          <input
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            className="input-field w-full"
            placeholder="000.000.000-00"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Email (opcional)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field pl-10 w-full"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Endereço (opcional)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className="input-field pl-10 w-full"
              placeholder="Rua, número, bairro"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Observações (opcional)</label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            className="input-field w-full"
            rows={3}
            placeholder="Anotações sobre o cliente..."
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-3"
          >
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
          <Link href="/dashboard/clientes" className="btn-secondary px-6 py-3">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
