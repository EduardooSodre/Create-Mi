import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    // Sempre envia o prompt puro do usuário para o DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) throw new Error("Nenhuma imagem foi gerada");

    return NextResponse.json({
      id: `img_${Date.now()}`,
      url: imageUrl,
      prompt,
      revisedPrompt: revisedPrompt || prompt,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro na API de combinação de imagens:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar imagem" },
      { status: 500 }
    );
  }
}
