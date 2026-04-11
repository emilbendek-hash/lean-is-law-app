import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const tools: any[] = [
  {
    functionDeclarations: [
      {
        name: "log_meal",
        description: "Log a meal with calories and macros",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the meal" },
            cal: { type: Type.NUMBER, description: "Calories" },
            pro: { type: Type.NUMBER, description: "Protein in grams" },
            carb: { type: Type.NUMBER, description: "Carbs in grams" },
            fat: { type: Type.NUMBER, description: "Fat in grams" },
          },
          required: ["name", "cal", "pro", "carb", "fat"],
        },
      },
      {
        name: "update_profile",
        description: "Update user profile information like goals, injuries, intensity, or macros",
        parameters: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING, enum: ["cut", "bulk", "maintain", "recomp"] },
            intensity: { type: Type.STRING, enum: ["quick", "standard", "killer"] },
            focus: { type: Type.ARRAY, items: { type: Type.STRING } },
            customMacros: {
              type: Type.OBJECT,
              properties: {
                cal: { type: Type.NUMBER },
                pro: { type: Type.NUMBER },
                carb: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              }
            }
          },
        },
      },
    ],
  },
];

export const getCoachResponse = async (
  prompt: string,
  history: any[],
  userContext: string
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `You are Coach Emil. You are brutal, clinical, and obsessed with discipline. Your mantra is 'LEAN IS LAW'. Your responses are short, high-impact, and tolerate no excuses. No emojis. No fluff.

User Context (Silently injected):
${userContext}` }],
      },
      ...history,
      { role: "user", parts: [{ text: prompt }] }
    ],
    config: {
      tools: [{ functionDeclarations: tools[0].functionDeclarations }],
    }
  });

  return response;
};

export const scanFuel = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: text,
    config: {
      systemInstruction: "You are a clinical nutritionist. Analyze the input food and provide estimated Calories, Protein, Carbs, and Fat. Return ONLY a JSON object: { \"name\": \"item name\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fat\": 0 }. Be conservative.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER }
        },
        required: ["name", "calories", "protein", "carbs", "fat"]
      }
    }
  });
  return JSON.parse(response.text);
};
