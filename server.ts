import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy initialization or safe client wrapper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chatbot API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, model = "gemini-3.5-flash", taskContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGeminiClient();

    // Map conversation history
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    // Augment system instruction with task context if provided
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

    const replyText = response.text || "I apologize, but I could not generate a response. Please try again.";

    // Optional: detect if the model proposed structured tasks to import
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
      // Ignore parsing errors for informal suggestions
    }

    return res.json({
      text: replyText,
      suggestedTasks,
      modelUsed: model,
    });
  } catch (error: unknown) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      error: errorMessage,
      fallbackText: "Sorry, there was an issue communicating with the AI model. Please verify your connection or try another model.",
    });
  }
});

// Image Generation API Endpoint
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, imageSize = "1K", aspectRatio = "1:1", model = "gemini-3-pro-image-preview" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt string is required." });
    }

    const validSizes = ["1K", "2K", "4K"];
    const chosenSize = validSizes.includes(imageSize) ? imageSize : "1K";

    const ai = getGeminiClient();

    // Primary model requested by prompt: gemini-3-pro-image-preview
    // With fallback cascade to gemini-3-pro-image or gemini-3.1-flash-image if unavailable
    let response;
    try {
      response = await ai.models.generateContent({
        model: model || "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: chosenSize,
          },
        },
      });
    } catch (primaryError) {
      console.warn(`Model ${model} failed, trying gemini-3.1-flash-image fallback...`, primaryError);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: chosenSize === "4K" ? "2K" : chosenSize, // in case 4k is restricted
          },
        },
      });
    }

    let imageUrl: string | null = null;
    let descriptionText = "";

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(422).json({
        error: "No image was generated by the model.",
        text: descriptionText,
      });
    }

    return res.json({
      imageUrl,
      text: descriptionText,
      imageSize: chosenSize,
      aspectRatio,
      prompt,
    });
  } catch (error: unknown) {
    console.error("Error in /api/generate-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
