'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { parsearCSV, downloadTemplate, type LinhaCSV } from '@/lib/csv-utils'
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

type Etapa = 'upload' | 'preview' | 'importando' | 'sucesso'

export default function CSVImporter() {
  const { addNotification } = useNotification()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [linhas, setLinhas] = useState<LinhaCSV[]>([])
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [totalValidas, setTotalValidas] = useState(0)
  const [totalComErros, setTotalComErros] = useState(0)
  const [progresso, setProgresso] = useState(0)
  const [importadas, setImportadas] = useState(0)
  const [falharam, setFalharam] = useState<string[]>([])

  // ════════════════════════════════════════════════════
  // 📂 SELECIONAR ARQUIVO
  // ════════════════════════════════════════════════════
  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validações básicas
    if (!file.name.match(/\.(csv|txt)$/i)) {
      addNotification('Arquivo deve ser .csv ou .txt', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification('Arquivo muito grande (máximo 5MB)', 'error')
      return
    }

    setErroGeral(null)

    const resultado = await parsearCSV(file)

    if (resultado.erroGeral) {
      setErroGeral(resultado.erroGeral)
      addNotification(resultado.erroGeral, 'error', 6000)
      return
    }

    if (resultado.linhas.length === 0) {
      setErroGeral('Nenhuma linha encontrada no arquivo')
      return
    }

    if (resultado.linhas.length > 500) {
      addNotification('Máximo 500 produtos por importação', 'warning')
    }

    setLinhas(resultado.linhas)
    setTotalValidas(resultado.totalValidas)
    setTotalComErros(resultado.totalComErros)
    setEtapa('preview')
  }

  // ════════════════════════════════════════════════════
  // 🚀 IMPORTAR PRODUTOS
  // ════════════════════════════════════════════════════
  const handleImportar = async () => {
    setEtapa('importando')
    setProgresso(0)
    setImportadas(0)
    setFalharam([])

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      addNotification('Usuário não autenticado', 'error')
      setEtapa('preview')
      return
    }

    // Filtra só as válidas
    const linhasValidas = linhas.filter((l) => l.erros.length === 0)
    const totalParaImportar = linhasValidas.length

    if (totalParaImportar === 0) {
      addNotification('Nenhuma linha válida pra importar', 'warning')
      setEtapa('preview')
      return
    }

    // ✅ Verifica duplicatas (mesmo SKU já existe?)
    const skus = linhasValidas.map((l) => l.sku)
    const { data: existentes } = await supabase
      .from('produtos')
      .select('sku')
      .eq('usuario_id', user.id)
      .in('sku', skus)

    const skusExistentes = new Set((existentes || []).map((p) => p.sku))

    const skusDuplicados = linhasValidas.filter((l) => skusExistentes.has(l.sku))
    if (skusDuplicados.length > 0) {
      const lista = skusDuplicados.slice(0, 3).map((l) => l.sku).join(', ')
      addNotification(
        `${skusDuplicados.length} produto(s) com SKU já existente serão pulados: ${lista}${skusDuplicados.length > 3 ? '...' : ''}`,
        'warning',
        6000
      )
    }

    const novasLinhas = linhasValidas.filter((l) => !skusExistentes.has(l.sku))

    // ════════════════════════════════════════════════════
    // 📦 IMPORTA EM LOTES DE 50 (evita timeout)
    // ════════════════════════════════════════════════════
    const TAMANHO_LOTE = 50
    const falhas: string[] = []
    let totalSucesso = 0

    for (let i = 0; i < novasLinhas.length; i += TAMANHO_LOTE) {
      const lote = novasLinhas.slice(i, i + TAMANHO_LOTE)

      const produtosParaInserir = lote.map((l) => ({
        nome: l.nome,
        sku: l.sku,
        categoria: l.categoria,
        descricao: l.descricao,
        quantidade_atual: l.quantidade_atual,
        quantidade_minima: l.quantidade_minima,
        preco_custo: l.preco_custo,
        preco_venda: l.preco_venda,
        data_validade: l.data_validade,
        ativo: true,
        usuario_id: user.id,
      }))

      const { error } = await supabase.from('produtos').insert(produtosParaInserir)

      if (error) {
        // Se deu erro, tenta um por um pra identificar quais falharam
        for (const produto of produtosParaInserir) {
          const { error: erroSingular } = await supabase
            .from('produtos')
            .insert(produto)

          if (erroSingular) {
            // 🔒 Se for limite do plano Iniciante, para tudo
            if (erroSingular.message?.includes('Limite de 100 produtos')) {
              falhas.push(
                `⚠️ Limite de 100 produtos atingido. Importação parou em ${totalSucesso}.`
              )
              setImportadas(totalSucesso)
              setFalharam(falhas)
              setEtapa('sucesso')
              addNotification(
                `Plano Iniciante limitado a 100 produtos. Faça upgrade!`,
                'warning',
                8000
              )
              return
            }
            falhas.push(`${produto.nome} (SKU: ${produto.sku}): ${erroSingular.message}`)
          } else {
            totalSucesso++
          }
        }
      } else {
        totalSucesso += lote.length
      }

      // Atualiza progresso
      const percentual = Math.round(((i + lote.length) / novasLinhas.length) * 100)
      setProgresso(Math.min(percentual, 100))
      setImportadas(totalSucesso)
    }

    setFalharam(falhas)
    setEtapa('sucesso')
    addNotification(
      `✅ ${totalSucesso} produto(s) importado(s) com sucesso!`,
      'success',
      5000
    )
  }

  // ════════════════════════════════════════════════════
  // 🔄 RESETAR
  // ════════════════════════════════════════════════════
  const handleResetar = () => {
    setEtapa('upload')
    setLinhas([])
    setErroGeral(null)
    setTotalValidas(0)
    setTotalComErros(0)
    setProgresso(0)
    setImportadas(0)
    setFalharam([])
    if (inputRef.current) inputRef.current.value = ''
  }

  // ════════════════════════════════════════════════════
  // 🎨 RENDER POR ETAPA
  // ════════════════════════════════════════════════════

  // ── ETAPA 1: UPLOAD ──
  if (etapa === 'upload') {
    return (
      <div className="space-y-6">
        {/* Card principal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Importe seus produtos de uma vez
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Tem uma planilha do Excel ou Google Sheets? Importe até 500 produtos
            de uma vez. Economize horas!
          </p>

          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-blue-500/30 text-white font-bold py-3 px-8 rounded-full transition"
          >
            <Upload className="w-5 h-5" />
            Selecionar arquivo CSV
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleSelecionarArquivo}
            className="hidden"
          />

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Arquivos .csv ou .txt • Máximo 5MB • Até 500 produtos
          </p>
        </div>

        {erroGeral && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{erroGeral}</p>
          </div>
        )}

        {/* Como funciona */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📋 Como funciona
          </h4>
          <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                1
              </span>
              <span>
                <strong>Baixe o template</strong> abaixo (modelo do CSV).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                2
              </span>
              <span>
                <strong>Abra no Excel ou Google Sheets</strong> e preencha com seus produtos.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                3
              </span>
              <span>
                <strong>Salve como CSV</strong> e clique em &ldquo;Selecionar arquivo&rdquo; acima.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                4
              </span>
              <span>
                <strong>Revise o preview</strong> e confirme a importação.
              </span>
            </li>
          </ol>

          <button
            onClick={downloadTemplate}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm transition"
          >
            <Download className="w-4 h-4" />
            Baixar template CSV
          </button>
        </div>

        {/* Dicas */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
            💡 Dicas importantes
          </h4>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>
              • <strong>Não mude o cabeçalho</strong> do CSV (primeira linha)
            </li>
            <li>
              • <strong>SKU duplicado é pulado</strong> (não sobrescreve produto existente)
            </li>
            <li>
              • Use <strong>vírgula ou ponto</strong> nos preços (ex: 9.90 ou 9,90)
            </li>
            <li>
              • Datas: formato <strong>AAAA-MM-DD</strong> ou <strong>DD/MM/AAAA</strong>
            </li>
            <li>
              • Categorias válidas: Alimentos, Bebidas, Limpeza, Higiene, Eletrônicos, Outros
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // ── ETAPA 2: PREVIEW ──
  if (etapa === 'preview') {
    return (
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">
                Válidas
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">
              {totalValidas}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400 uppercase">
                Com erros
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-400">
              {totalComErros}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                Total
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
              {linhas.length}
            </div>
          </div>
        </div>

        {/* Aviso de erros */}
        {totalComErros > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {totalComErros} linha(s) com erro serão ignoradas
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Corrija no Excel e tente novamente, ou continue importando só as válidas.
              </p>
            </div>
          </div>
        )}

        {/* Tabela de preview */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    #
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Nome
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    SKU
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Categoria
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Preço
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Qtd
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr
                    key={linha.linha}
                    className={`border-t border-gray-100 dark:border-gray-800 ${
                      linha.erros.length > 0
                        ? 'bg-red-50/50 dark:bg-red-900/10'
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      L{linha.linha}
                    </td>
                    <td className="px-3 py-2">
                      {linha.erros.length === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span
                          className="inline-flex items-center"
                          title={linha.erros.join(' • ')}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                      {linha.nome || (
                        <span className="text-red-500 italic">vazio</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {linha.sku || (
                        <span className="text-red-500 italic">vazio</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {linha.categoria}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">
                      R$ {linha.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                      {linha.quantidade_atual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhes de erros */}
        {totalComErros > 0 && (
          <details className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <summary className="px-5 py-3 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
              Ver {totalComErros} erro(s) detalhado(s)
            </summary>
            <div className="px-5 py-3 space-y-2 max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
              {linhas
                .filter((l) => l.erros.length > 0)
                .map((linha) => (
                  <div
                    key={linha.linha}
                    className="text-sm bg-red-50 dark:bg-red-900/20 rounded p-3 border border-red-200 dark:border-red-800"
                  >
                    <p className="font-semibold text-red-900 dark:text-red-300">
                      Linha {linha.linha}: {linha.nome || '(sem nome)'}
                    </p>
                    <ul className="mt-1 text-xs text-red-700 dark:text-red-400 list-disc list-inside">
                      {linha.erros.map((erro, i) => (
                        <li key={i}>{erro}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResetar}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
          >
            ← Escolher outro arquivo
          </button>
          <button
            onClick={handleImportar}
            disabled={totalValidas === 0}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:shadow-green-500/30 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow-none text-white font-bold py-3 px-6 rounded-xl transition"
          >
            Importar {totalValidas} produto(s) válido(s) ✓
          </button>
        </div>
      </div>
    )
  }

  // ── ETAPA 3: IMPORTANDO ──
  if (etapa === 'importando') {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center space-y-5">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Importando produtos...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {importadas} de {totalValidas} produto(s)
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="max-w-md mx-auto">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {progresso}%
          </p>
        </div>

        <p className="text-xs text-gray-400">
          Não feche essa página até terminar!
        </p>
      </div>
    )
  }

  // ── ETAPA 4: SUCESSO ──
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Importação concluída! 🎉
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          <span className="font-bold text-green-700 dark:text-green-400">
            {importadas}
          </span>{' '}
          produto(s) foram cadastrado(s) com sucesso.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl text-white font-bold py-3 px-6 rounded-xl transition"
          >
            Ver produtos
          </Link>
          <button
            onClick={handleResetar}
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition border border-gray-200 dark:border-gray-700"
          >
            Importar outro arquivo
          </button>
        </div>
      </div>

      {/* Falhas (se houver) */}
      {falharam.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {falharam.length} produto(s) não foram importado(s)
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {falharam.map((erro, i) => (
              <p
                key={i}
                className="text-xs text-amber-800 dark:text-amber-200 font-mono"
              >
                {erro}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}