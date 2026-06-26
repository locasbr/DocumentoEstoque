'use client'

import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  message: string
  title?: string
  type?: AlertType
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  floating?: boolean
}

const STYLES = {
  success: {
    container:
      'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    title: 'text-green-900 dark:text-green-100',
    text: 'text-green-800 dark:text-green-200',
    progress: 'bg-green-500 dark:bg-green-400',
    glow: 'shadow-green-500/10',
    actionBtn:
      'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50',
  },
  error: {
    container:
      'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    title: 'text-red-900 dark:text-red-100',
    text: 'text-red-800 dark:text-red-200',
    progress: 'bg-red-500 dark:bg-red-400',
    glow: 'shadow-red-500/10',
    actionBtn:
      'text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50',
  },
  warning: {
    container:
      'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    title: 'text-amber-900 dark:text-amber-100',
    text: 'text-amber-800 dark:text-amber-200',
    progress: 'bg-amber-500 dark:bg-amber-400',
    glow: 'shadow-amber-500/10',
    actionBtn:
      'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50',
  },
  info: {
    container:
      'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    title: 'text-blue-900 dark:text-blue-100',
    text: 'text-blue-800 dark:text-blue-200',
    progress: 'bg-blue-500 dark:bg-blue-400',
    glow: 'shadow-blue-500/10',
    actionBtn:
      'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50',
  },
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const ARIA_ROLE = {
  success: 'status',
  error: 'alert',
  warning: 'alert',
  info: 'status',
} as const

export default function Alert({
  message,
  title,
  type = 'info',
  duration = 5000,
  onClose,
  action,
  floating = false,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef<number>(Date.now())
  const styles = STYLES[type]
  const Icon = ICONS[type]

  // Fecha com animação suave
  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 250)
  }

  // Auto-dismiss com pausa no hover
  useEffect(() => {
    if (!duration || duration === 0) return

    let animationFrame: number
    let timeoutId: NodeJS.Timeout

    const tick = () => {
      if (isPaused) {
        animationFrame = requestAnimationFrame(tick)
        return
      }
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(newProgress)

      if (newProgress > 0) {
        animationFrame = requestAnimationFrame(tick)
      }
    }

    animationFrame = requestAnimationFrame(tick)
    timeoutId = setTimeout(handleClose, duration)

    return () => {
      cancelAnimationFrame(animationFrame)
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, isPaused])

  // Suporte ao ESC pra fechar (acessibilidade)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isVisible) return null

  const containerClasses = floating
    ? 'fixed top-4 right-4 z-50 max-w-sm w-full sm:w-96'
    : 'w-full mb-4'

  return (
    <div
      className={containerClasses}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        role={ARIA_ROLE[type]}
        aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
        className={`
          relative overflow-hidden
          border rounded-xl backdrop-blur-sm
          shadow-lg ${styles.glow}
          transition-all duration-300 ease-out
          ${styles.container}
          ${
            isLeaving
              ? 'opacity-0 translate-x-2 scale-95'
              : 'opacity-100 translate-x-0 scale-100 animate-alert-in'
          }
        `}
      >
        {/* Conteúdo */}
        <div className="flex items-start gap-3 p-4 pr-12">
          {/* Ícone com fundo */}
          <div
            className={`
              flex-shrink-0 w-9 h-9 rounded-full
              flex items-center justify-center
              ${styles.iconBg}
            `}
          >
            <Icon className={`w-5 h-5 ${styles.icon}`} strokeWidth={2.5} />
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0 pt-0.5">
            {title && (
              <h4 className={`font-semibold text-sm mb-0.5 ${styles.title}`}>
                {title}
              </h4>
            )}
            <p className={`text-sm leading-relaxed ${styles.text}`}>
              {message}
            </p>

            {/* Ação opcional */}
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  mt-2 px-3 py-1 rounded-md
                  text-xs font-semibold
                  transition-colors
                  ${styles.actionBtn}
                `}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          aria-label="Fechar alerta"
          className={`
            absolute top-3 right-3
            w-7 h-7 rounded-md
            flex items-center justify-center
            ${styles.text}
            opacity-60 hover:opacity-100
            hover:bg-black/5 dark:hover:bg-white/10
            transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
          `}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Barra de progresso */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
            <div
              className={`h-full ${styles.progress} transition-all`}
              style={{
                width: `${progress}%`,
                transition: isPaused ? 'none' : 'width 100ms linear',
              }}
            />
          </div>
        )}
      </div>

      {/* Animações CSS inline (não precisa mexer no tailwind.config) */}
      <style jsx>{`
        @keyframes alert-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-alert-in {
          animation: alert-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}