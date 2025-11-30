import { GoogleGenAI, Type } from "@google/genai";
import { BRIEFING_PROMPT } from '../constants';
import { BriefingData } from '../types';

let genAI: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.warn("Failed to initialize Gemini Client", e);
}

export const getMissionBriefing = async (wave: number): Promise<BriefingData> => {
  // Simple heuristic to differentiate flavor text
  const mode = wave > 5 ? "Endless Survival" : "Campaign Operation";

  if (!genAI) {
    return {
      title: `Sector ${wave} Initiated`,
      description: "Communications offline. Proceed with caution.",
      enemyIntel: "Unknown hostiles detected on radar."
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: BRIEFING_PROMPT(wave, mode),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            enemyIntel: { type: Type.STRING },
          },
          required: ["title", "description", "enemyIntel"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as BriefingData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: `Wave ${wave}: Emergency Override`,
      description: "AI Link Unstable. Manual control engaged.",
      enemyIntel: "Hostile forces incoming. Eliminate all targets."
    };
  }
};