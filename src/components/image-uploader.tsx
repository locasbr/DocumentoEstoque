'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { validateImageFile, fileToDataUrl } from '@/lib/image-utils'
import { useNotification } from '@/contexts/NotificationContext'

interface ImageUploaderProps {
  onImageSelected: (file: File) => void
  currentImage?: string
  label?: string
}

export default function ImageUploader({
  onImageSelected,
  currentImage,
  label = 'Adicionar Imagem do Produto',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(currentImage || '')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addNotification } = useNotification()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    try {
      // Validar arquivo
      const validation = validateImageFile(file)
      if (!validation.valid) {
        addNotification(validation.error!, 'error')
        setLoading(false)
        return
      }

      // Criar preview
      const dataUrl = await fileToDataUrl(file)
      setPreview(dataUrl)

      // Notificar componente pai
      onImageSelected(file)
      addNotification('Imagem selecionada com sucesso!', 'success', 3000)
    } catch (error) {
      addNotification('Erro ao processar imagem', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div
        onClick={handleClick}
        className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />

        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-40 object-cover rounded"
            />
            <button
              onClick={handleClear}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex justify-center mb-2">
              {loading ? (
                <div className="animate-spin">
                  <ImageIcon size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
              ) : (
                <Upload size={32} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {loading ? 'Processando...' : 'Clique para adicionar ou arraste a imagem'}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
              JPG, PNG ou WebP (máx: 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
