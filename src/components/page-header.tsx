'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  /**
   * Pequeno texto acima do título (opcional)
   */
  eyebrow?: string

  /**
   * Título principal (obrigatório)
   */
  title: string

  /**
   * Descrição abaixo do título (opcional)
   */
  description?: string

  /**
   * Ícone do Lucide (opcional)
   */
  icon?: LucideIcon

  /**
   * Ações/botões à direita (opcional)
   */
  actions?: ReactNode

  /**
   * Conteúdo adicional abaixo (filtros, etc) (opcional)
   */
  children?: ReactNode

  /**
   * Classes customizadas (opcional)
   */
  className?: string
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`w-full min-w-0 ${className}`}>
      {/* Header Principal */}
      <div className="mb-6 flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Esquerda: Ícone + Texto */}
        <div className="flex min-w-0 items-start gap-4 md:flex-1">
          {Icon && (
            <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:flex">
              <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {eyebrow}
              </p>
            )}
            <h1 className="mb-2 break-words text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 md:text-base">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Direita: Ações */}
        {actions && (
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:max-w-[42rem] md:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Conteúdo Adicional (Filtros, etc) */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}
    </div>
  )
}
