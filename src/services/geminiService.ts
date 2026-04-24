import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiService {
  /**
   * Process an image to extract question details and knowledge points.
   */
  static async identifyQuestion(base64Image: string, mimeType: string): Promise<OCRResult> {
    const prompt = `
      You are an expert OCR and education assistant. 
      Analyze the provided image of a school question.
      Extract:
      1. The full text of the question.
      2. Multiple choice options (if present).
      3. The standard answer (if present in the image).
      4. The core knowledge point (short phrase like "Quadratic Equations" or "Present Perfect Tense").
      5. The subject (e.g., Math, Physics, English).

      Format the output as JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Vision is better on Pro
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            knowledgePoint: { type: Type.STRING },
            subject: { type: Type.STRING }
          },
          required: ["text", "knowledgePoint"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }

  /**
   * Generate 3 similar questions based on a core question and knowledge point.
   */
  static async generateSimilarQuestions(
    originalQuestion: string,
    knowledgePoint: string,
    subject: string = "Generative"
  ): Promise<Question[]> {
    const prompt = `
      Based on this original question: "${originalQuestion}" 
      and knowledge point: "${knowledgePoint}" in ${subject},
      generate 3 similar "one-to-one" exercise questions (举一反三).
      
      Requirements for each question:
      1. Target the same knowledge point but use different numbers, scenarios, or variations.
      2. Provide the correct answer.
      3. Provide a detailed explanation focusing on "Common Errors" (易错点分析).
      4. Maintain a similar difficulty level.

      Format the output as a JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              commonErrors: { type: Type.STRING, description: "Analysis of common mistakes for this type of problem" }
            },
            required: ["content", "answer", "explanation", "commonErrors"]
          }
        }
      }
    });

    const items = JSON.parse(response.text || "[]");
    return items.map((item: any, index: number) => ({
      ...item,
      id: `gen-${Date.now()}-${index}`,
      isOriginal: false
    }));
  }
}
