import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

/**
 * Uses Gemini 2.5 Flash to generate a detailed explanation for a question.
 * This is used when the static explanation is insufficient or the user asks for "AI Tutor" help.
 */
export const getAIExplanation = async (question: Question): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return "API Key not found. Please configure process.env.API_KEY to use AI explanations.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert academic tutor. 
      Explain clearly why the correct answer is correct for the following multiple choice question.
      
      Subject: ${question.subjectId}
      Question: ${question.text}
      Options:
      ${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}
      
      Correct Answer: ${question.options[question.correctOptionIndex]}
      
      Provide a concise (max 100 words) but educational explanation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to connect to AI Tutor. Please try again later.";
  }
};
