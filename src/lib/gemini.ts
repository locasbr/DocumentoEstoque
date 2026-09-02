import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY não configurada");
}

const gemini = new GoogleGenerativeAI(apiKey || "");

export const modeloFlashLite = gemini.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 1024,
  },
});

export async function chamarIA(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  try {
    const result = await modeloFlashLite.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    console.error("Erro Gemini:", error);
    throw new Error("Erro ao chamar IA");
  }
}

export async function chamarIAJson<T = unknown>(prompt: string): Promise<T> {
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as T;
  } catch (error: unknown) {
    console.error("Erro Gemini JSON:", error);
    throw new Error("Erro ao processar resposta da IA");
  }
}
