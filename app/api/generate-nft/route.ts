import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Initialize Gemini API client
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      console.error("GEMINI_API key not found");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Generate image using Gemini (try multiple models for compatibility)
    let response;
    const models = [
      "gemini-2.5-flash-image-preview",
      "gemini-1.5-flash-image-preview",
      "gemini-pro-vision",
    ];

    let lastError;
    for (const modelName of models) {
      try {
        // console.log(`Trying model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        });
        // console.log(`Successfully used model: ${modelName}`);
        break;
      } catch (modelError) {
        // console.log(`Model ${modelName} failed:`, modelError);
        lastError = modelError;
        continue;
      }
    }

    if (!response) {
      console.error("All models failed. Last error:", lastError);
      throw lastError;
    }

    // Check if response has candidates
    if (!response.candidates || response.candidates.length === 0) {
      return NextResponse.json(
        { error: "No response generated from AI" },
        { status: 500 }
      );
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    // Extract the generated image
    let imageData = null;
    let mimeType = "image/png";
    let description = "";

    for (const part of candidate.content.parts) {
      if (part.text) {
        description += part.text;
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "No image was generated" },
        { status: 500 }
      );
    }

    // Convert base64 to data URL for client-side display
    const imageUrl = `data:${mimeType};base64,${imageData}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      description: description.trim(),
      prompt: prompt.trim(),
    });
  } catch (error) {
    console.error("NFT Generation Error:", error);

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Authentication error" },
          { status: 401 }
        );
      }
      if (error.message.includes("QUOTA")) {
        return NextResponse.json(
          {
            error: "Gemini API Not Properly Configured",
            details:
              "Your API key doesn't have access to image generation. Please enable billing and request quota increase for 'generativelanguage.googleapis.com' in Google Cloud Console.",
            help: "1. Go to Google Cloud Console → Billing → Enable Billing\n2. Go to APIs & Services → Quotas → Find 'Generative Language API'\n3. Request quota increase for image generation",
            link: "https://console.cloud.google.com/billing",
            retryAfter: "Not applicable - requires billing setup",
          },
          { status: 429 }
        );
      }
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          {
            error:
              "Content violates safety guidelines. Please try a different prompt.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate NFT. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
