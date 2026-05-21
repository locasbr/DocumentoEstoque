import { supabase } from './supabase'

const STORAGE_BUCKET = 'product-images'

/**
 * Upload de imagem do produto
 */
export async function uploadProductImage(
  file: File,
  produtoId: string
): Promise<{ path: string; url: string } | null> {
  try {
    const filename = `${produtoId}_${Date.now()}_${file.name}`
    const filePath = `produtos/${filename}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

    return { path: filePath, url: publicUrl }
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error)
    return null
  }
}

/**
 * Deletar imagem do produto
 */
export async function deleteProductImage(imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([imagePath])

    if (error) {
      console.error('Erro ao deletar imagem:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao deletar imagem:', error)
    return false
  }
}

/**
 * Obter URL pública da imagem
 */
export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '/placeholder-product.png'
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

/**
 * Validar arquivo de imagem
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande (máx: 5MB)' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado (JPG, PNG ou WebP)' }
  }

  return { valid: true }
}

/**
 * Converter arquivo para data URL para preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
