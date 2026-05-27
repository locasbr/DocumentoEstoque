// src/components/barcode-product-modal.tsx
'use client'

import { ProdutoBarcode } from '@/lib/barcode-api'
import { CheckCircle, X, Search } from 'lucide-react'
import Image from 'next/image'

interface Props {
  codigo: string
  produto: ProdutoBarcode
  loading: boolean
  onConfirmar: (produto: ProdutoBarcode) => void
  onCancelar: () => void
}

export default function BarcodeProductModal({ codigo, produto, loading, onConfirmar, onCancelar }: Props) {
  return (
    <div className="fixed inset-0 z-[9998] bg-black/50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Código detectado</h2>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {/* Código lido */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 mb-4 font-mono text-sm text-center text-gray-600 dark:text-gray-300">
            {codigo}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Buscando informações do produto...</p>
            </div>
          ) : produto.encontrado ? (
            <div>
              {/* Produto encontrado */}
              <div className="flex items-start gap-4 mb-5">
                {produto.imagem_url ? (
                  <Image
                    src={produto.imagem_url}
                    alt={produto.nome}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border dark:border-gray-700"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Search size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Encontrado via {produto.fonte}</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{produto.nome}</p>
                  {produto.descricao && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{produto.descricao}</p>
                  )}
                  {produto.categoria && (
                    <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {produto.categoria}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Deseja preencher o formulário automaticamente com essas informações?
              </p>

              <div className="flex gap-3">
                <button onClick={onCancelar} className="flex-1 btn-secondary py-2.5">
                  Não, preencher manual
                </button>
                <button onClick={() => onConfirmar(produto)} className="flex-1 btn-primary py-2.5">
                  Sim, preencher!
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Produto não encontrado */}
              <div className="text-center py-4 mb-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Produto não encontrado</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Não encontramos esse código nas bases públicas. O SKU foi preenchido — complete os demais campos manualmente.
                </p>
              </div>
              <button onClick={onCancelar} className="w-full btn-primary py-2.5">
                Ok, preencher manualmente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
