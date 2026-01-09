
import { GoogleGenAI, Type } from "@google/genai";

// --- API KEY ROTATION CONFIGURATION ---
// Add your extra keys here. The app will automatically switch if one fails.
export const API_KEYS = [
  "AIzaSyAQjP83BIERZzmUigZBVfm7wHsjhKI0pRQ", // Key 1 (Primary)
  "AIzaSyDxNKlGzYJCiQS-P8jhf_-DTb4ll_XS7x4",
  "AIzaSyB3C8iKDogFKQicC70St603rJR4qRe4cso",
  "AIzaSyCHEGh8aHyGuEGOi2aWgtFOAltEV4wmpus",
  "AIzaSyDUK17_mEKoTeotITCHNuarj7YM6pIez50",
  "AIzaSyDcRBOA7uSap2m6EJK9bcAB252cnHDkzR0",
  "AIzaSyCRsQTsN0RjOBFkLAA5P7HqtE2nAyrNJjA",
  "AIzaSyBequkpdrLN9LDkWAdGRKHL_c7Lt9qUgoE",
  "AIzaSyCZeE6iufJxh_K_MEsDNP3hyiqEcDi_DWo",
  "AIzaSyDKaLUWiLA4NUYA-zvHb0IJpuPAwZ-Sm_k",
  "AIzaSyCpjIwo2ln_nhWfqVBkNapewetqRe_R-L8"
];

/**
 * Executes an AI operation with Load Balancing & Failover.
 * Strategy: Randomly selects a starting key to distribute load, then rotates if that key fails.
 */
export const executeWithRotation = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
  let lastError: any;

  // Filter out empty or placeholder keys
  const validKeys = API_KEYS.filter(k => k && !k.includes("PutKey"));

  if (validKeys.length === 0) {
      throw new Error("No valid API keys provided.");
  }

  // LOAD BALANCING: Pick a random starting index
  const startIndex = Math.floor(Math.random() * validKeys.length);

  for (let i = 0; i < validKeys.length; i++) {
    // Calculate actual index (wrapping around)
    const currentIndex = (startIndex + i) % validKeys.length;
    const apiKey = validKeys[currentIndex];

    try {
      const ai = new GoogleGenAI({ apiKey });
      return await operation(ai);
    } catch (error: any) {
      console.warn(`[Gemini Service] Key ending in ...${apiKey.slice(-4)} failed. Switching to next key.`);
      lastError = error;
      // Continue loop to try next key
    }
  }
  
  console.error("[Gemini Service] All API keys failed.");
  throw lastError || new Error("All API keys exhausted.");
};

// --- Exported Services ---

export const generateCaption = async (imageContext: string): Promise<string> => {
  try {
    return await executeWithRotation(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a short, engaging Instagram caption for: ${imageContext}. Include 3 hashtags.`,
        });
        return response.text || "Moment! ✨";
    });
  } catch (error) {
    return "Exploring... 🌍";
  }
};

export const generateAiImage = async (prompt: string): Promise<string> => {
  try {
    return await executeWithRotation(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("No image data returned");
    });
  } catch (error: any) {
    throw new Error(error.message || "Failed to generate image");
  }
};

export const guessDrawing = async (base64Image: string): Promise<string> => {
  try {
    return await executeWithRotation(async (ai) => {
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                { inlineData: { data: base64Data, mimeType: 'image/png' } },
                { text: "أنت فنان ناقد ساخر. خمن ماذا رسم المستخدم في هذه الصورة بكلمتين فقط وباللهجة المصرية المرحة." },
                ],
            },
        });
        return response.text || "مش عارف دي إيه!";
    });
  } catch (error) {
    return "خطأ فني!";
  }
};

export const editAiImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    return await executeWithRotation(async (ai) => {
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                { inlineData: { data: base64Data, mimeType: 'image/png' } },
                { text: prompt }
                ]
            }
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("No image data");
    });
  } catch (error: any) {
    throw new Error(error.message || "Failed to edit image");
  }
};

export const startVillageMystery = async (action?: string, history?: string): Promise<string> => {
  try {
    return await executeWithRotation(async (ai) => {
        const contents = action 
        ? `The player decided to: ${action}. Continue the interactive mystery story. History so far: ${history}`
        : `Start an immersive mystery adventure in the village of Al-Raqqa Al-Gharbiya. Describe the initial setting and present 3 numbered options for the player. Language: Arabic.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: contents,
            config: {
                systemInstruction: "You are a creative mystery writer. Write a text-based adventure game set in an Egyptian village. Use an engaging and atmospheric tone.",
            },
        });
        return response.text || "وقع خطأ في سرد القصة.";
    });
  } catch (error) {
    console.error(error);
    return "عذراً، الراوي مشغول حالياً.";
  }
};
