'use client'

import { useRef } from 'react'
import { Printer, Share2, X } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

export interface ItemCupom {
  nome: string
  sku?: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface DadosCupom {
  numero_venda: string
  itens: ItemCupom[]
  subtotal: number
  desconto: number
  total: number
  forma_pagamento: string
  troco?: number
  valor_recebido?: number
  nome_negocio?: string
  data: Date
  operador?: string
}

interface CupomProps {
  dados: DadosCupom
  onFechar?: () => void
}

export default function CupomImpressao({ dados, onFechar }: CupomProps) {
  const cupomRef = useRef<HTMLDivElement>(null)

  const nomeLoja = dados.nome_negocio || 'Meu Mercado'
  const dataFormatada = dados.data.toLocaleDateString('pt-BR')
  const horaFormatada = dados.data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleImprimir() {
    window.print()
  }

  function handleWhatsApp() {
    const linhas = [
      `🧾 *CUPOM - ${nomeLoja}*`,
      `📅 ${dataFormatada} às ${horaFormatada}`,
      `Venda #${dados.numero_venda}`,
      ``,
      `*ITENS:*`,
      ...dados.itens.map(
        (item) =>
          `• ${item.nome} x${item.quantidade} = ${formatarMoeda(item.subtotal)}`
      ),
      ``,
      dados.desconto > 0 ? `Subtotal: ${formatarMoeda(dados.subtotal)}` : '',
      dados.desconto > 0 ? `Desconto: -${formatarMoeda(dados.desconto)}` : '',
      `*TOTAL: ${formatarMoeda(dados.total)}*`,
      `Pagamento: ${dados.forma_pagamento}`,
      dados.troco && dados.troco > 0
        ? `Troco: ${formatarMoeda(dados.troco)}`
        : '',
      ``,
      `_Obrigado pela preferência!_`,
    ]
      .filter(Boolean)
      .join('\n')

    const url = `https://wa.me/?text=${encodeURIComponent(linhas)}`
    window.open(url, '_blank')
  }

  return (
    <>
      {/* Estilo de impressão — só o cupom aparece */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cupom-print, #cupom-print * { visibility: visible; }
          #cupom-print {
            position: fixed;
            top: 0; left: 0;
            width: 80mm;
            font-size: 12px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 no-print">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Cupom Fiscal</h2>
            <div className="flex gap-2">
              <button
                onClick={handleImprimir}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-80 transition"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
              >
                <Share2 size={16} />
                WhatsApp
              </button>
              {onFechar && (
                <button
                  onClick={onFechar}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Cupom — área que será impressa */}
          <div className="overflow-y-auto flex-1">
            <div
              id="cupom-print"
              ref={cupomRef}
              className="p-4 font-mono text-sm text-gray-900"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {/* Cabeçalho da loja */}
              <div className="text-center mb-3">
                <p className="font-bold text-base uppercase">{nomeLoja}</p>
                <p className="text-xs text-gray-500">Sistema de Gestão EstoqueSystem</p>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <p className="text-xs">
                  {dataFormatada} às {horaFormatada}
                </p>
                <p className="text-xs">Venda #{dados.numero_venda}</p>
                {dados.operador && (
                  <p className="text-xs">Operador: {dados.operador}</p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Itens */}
              <div className="mb-2">
                <p className="font-bold text-xs uppercase mb-2">Itens</p>
                {dados.itens.map((item, idx) => (
                  <div key={idx} className="mb-1.5">
                    <p className="font-medium leading-tight">{item.nome}</p>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>
                        {item.quantidade}x {formatarMoeda(item.preco_unitario)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatarMoeda(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Totais */}
              <div className="space-y-1 text-sm">
                {dados.desconto > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatarMoeda(dados.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Desconto</span>
                      <span>-{formatarMoeda(dados.desconto)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-dashed border-gray-400">
                  <span>TOTAL</span>
                  <span>{formatarMoeda(dados.total)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Pagamento */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Forma de pagamento</span>
                  <span className="font-medium">{dados.forma_pagamento}</span>
                </div>
                {dados.valor_recebido && dados.valor_recebido > 0 && (
                  <div className="flex justify-between">
                    <span>Valor recebido</span>
                    <span>{formatarMoeda(dados.valor_recebido)}</span>
                  </div>
                )}
                {dados.troco && dados.troco > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Troco</span>
                    <span>{formatarMoeda(dados.troco)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 my-3" />

              {/* Rodapé */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Obrigado pela preferência!</p>
                <p>Volte sempre 😊</p>
                <div className="mt-3 text-[10px] text-gray-400">
                  <p>Este não é um documento fiscal</p>
                  <p>EstoqueSystem v1.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
