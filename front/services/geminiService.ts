import { GoogleGenAI } from "@google/genai";

// Initialize the client.
// Note: In a production app, never expose keys on the client side.
// This is strictly for the requested demo environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateComicDescription = async (title: string, author: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini.");
    return "AI generation unavailable without API Key.";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `Write a short, exciting, and marketing-style description (max 2 sentences) for a new comic book titled "${title}" by author "${author}". Do not use quotes in the output.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Description could not be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};
