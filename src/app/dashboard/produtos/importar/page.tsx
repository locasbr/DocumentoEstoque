'use client'

import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet, Sparkles } from 'lucide-react'
import CSVImporter from '@/components/csv-importer'
import { usePlano } from '@/hooks/usePlano'
import UpgradeBlock from '@/components/upgrade-block'

export default function ImportarProdutosPage() {
  const { isIniciante, loading: loadingPlano } = usePlano()

  // ════════════════════════════════════════════════════
  // 🔄 LOADING DO PLANO
  // ════════════════════════════════════════════════════
  if (loadingPlano) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // 🔒 BLOQUEIO PARA PLANO INICIANTE
  // ════════════════════════════════════════════════════
  if (isIniciante) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </Link>

        <UpgradeBlock
          titulo="Importação CSV em massa"
          descricao="Cadastre até 500 produtos de uma vez via arquivo CSV (Excel/Google Sheets). Economize horas e tenha seu catálogo completo em minutos. Disponível nos planos Profissional e Negócio."
          planoNecessario="profissional"
        />

        {/* Bônus: mostra preview do que ele perde */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ✨ O que você ganha com importação CSV
          </h3>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>
                <strong>Cadastre 100, 200, até 500 produtos</strong> de uma vez (em vez de um por um)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>
                <strong>Migre do Excel ou planilha</strong> em segundos
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>
                <strong>Preview antes de importar</strong> (valida tudo e mostra erros)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>
                <strong>Template pronto</strong> pra baixar e preencher
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>
                <strong>SKU duplicado é pulado automaticamente</strong> (não sobrescreve)
              </span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // ✅ VERSÃO COMPLETA (Profissional + Negócio + Admin)
  // ════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Importar produtos via CSV
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Cadastre vários produtos de uma vez usando uma planilha
            </p>
          </div>
        </div>

        {/* Badge do plano */}
        <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
          <Sparkles className="w-3 h-3" />
          Recurso do plano Profissional
        </div>
      </div>

      {/* Componente principal */}
      <CSVImporter />
    </div>
  )
}