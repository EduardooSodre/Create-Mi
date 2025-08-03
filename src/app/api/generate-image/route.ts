import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationRequest {
  prompt: string;
  style?: "vivid" | "natural";
  quality?: "standard" | "hd";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}



function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    if (!body.prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }
    // Envia apenas o prompt puro do usuário para o DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: body.prompt,
      n: 1,
      size: body.size || "1024x1024",
      quality: body.quality || "hd",
      style: body.style || "vivid",
    });
    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) throw new Error("Nenhuma imagem foi gerada");
    return NextResponse.json({
      id: generateImageId(),
      url: imageUrl,
      prompt: body.prompt,
      revisedPrompt: response.data?.[0]?.revised_prompt || body.prompt,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro interno do servidor ao gerar imagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao gerar imagem" },
      { status: 500 }
    );
  }
}
