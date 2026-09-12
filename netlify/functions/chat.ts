import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "GEMINI_API_KEY environment variable is missing.",
          fallbackText:
            "Gemini API key is not configured on Netlify. Please set GEMINI_API_KEY in your Netlify Dashboard under Site configuration > Environment variables.",
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing request body." }),
      };
    }

    const payload = JSON.parse(event.body);
    const { messages, systemInstruction, model = "gemini-3.5-flash", taskContext } = payload;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Messages array is required." }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    let fullSystemInstruction = systemInstruction || "You are a helpful productivity assistant.";
    if (taskContext) {
      fullSystemInstruction += `\n\n--- Current User Task & History Context ---\n${taskContext}\nUse this context to give actionable, personalized advice, review past tasks, celebrate completed tasks, and suggest tasks when requested.`;
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
      },
    });

    const replyText =
      response.text || "I apologize, but I could not generate a response. Please try again.";

    let suggestedTasks: Array<{ title: string; priority?: string; category?: string }> = [];
    try {
      const taskPattern = /```(?:json)?\s*\[\s*\{[\s\S]*?\}\s*\]\s*```/g;
      const match = taskPattern.exec(replyText);
      if (match) {
        const cleanJson = match[0].replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          suggestedTasks = parsed;
        }
      }
    } catch {
      // Ignore JSON parse errors for non-structured chat
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        text: replyText,
        suggestedTasks,
        modelUsed: model,
      }),
    };
  } catch (error: unknown) {
    console.error("Error in Netlify chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: errorMessage,
        fallbackText:
          "Sorry, there was an issue communicating with the AI model. Please check your connection and Netlify API key.",
      }),
    };
  }
};
