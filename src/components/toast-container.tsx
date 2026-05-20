'use client'

import { useNotification } from '@/contexts/NotificationContext'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
}

const colors = {
  success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800',
  error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800',
  info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800',
}

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto
            border rounded-lg p-4 flex items-center gap-3
            animate-in slide-in-from-right-full duration-300
            ${colors[notification.type]}
          `}
        >
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
