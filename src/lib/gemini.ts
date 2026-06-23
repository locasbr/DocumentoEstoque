import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY não configurada')
}

export const gemini = new GoogleGenerativeAI(apiKey || '')

// Gemini Flash-Lite Latest — alias que aponta pro modelo Lite mais recente
// Vantagem: quando o Google lançar versão nova, o app pega automaticamente
// Free tier: 15 req/min · 1.500 req/dia
export const modeloFlashLite = gemini.getGenerativeModel({
  model: 'gemini-flash-lite-latest', // 👈 ALIAS INTELIGENTE
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
})

export async function chamarIA(prompt: string): Promise<string> {
  try {
    const result = await modeloFlashLite.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Erro Gemini:', error)
    throw new Error('Erro ao chamar IA')
  }
}

export async function chamarIAJson<T = any>(prompt: string): Promise<T> {
  try {
    const model = gemini.getGenerativeModel({
      model: 'gemini-flash-lite-latest', // 👈 ALIAS INTELIGENTE
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const texto = result.response.text()
    return JSON.parse(texto)
  } catch (error) {
    console.error('Erro Gemini JSON:', error)
    throw new Error('Erro ao processar resposta da IA')
  }
}