'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')



  async function handleReset() {
    setErro('')
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem'); return }
    if (novaSenha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) setErro(error.message)
    else {
      setSucesso(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Nova senha</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Digite sua nova senha abaixo</p>
        </div>

        {sucesso ? (
          <div className="text-center space-y-3">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <p className="font-semibold text-gray-900 dark:text-gray-50">Senha atualizada!</p>
            <p className="text-sm text-gray-500">Redirecionando para o dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
              <div className="relative">
                <input type={mostrar ? 'text' : 'password'} value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full pr-10"
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setMostrar(!mostrar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
              <input type={mostrar ? 'text' : 'password'} value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full ${
                  confirmar && novaSenha !== confirmar ? 'border-red-400' : ''
                }`}
                placeholder="Repita a senha" />
              {confirmar && novaSenha !== confirmar && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
              )}
            </div>
            {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{erro}</p>}
            <button onClick={handleReset} disabled={loading || !novaSenha || novaSenha !== confirmar}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              <Lock size={16} />
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
