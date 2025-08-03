import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generateImageId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const image = formData.get("image") as File;
    const size = (formData.get("size") as string) || "1024x1024";

    if (!prompt || !image) {
      return NextResponse.json(
        { error: "Prompt e imagem são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("Editando com SEU prompt:", prompt);

    // Usar DALL-E 2 diretamente com SEU prompt exato
    const response = await openai.images.edit({
      model: "gpt-4o",
      image: image,
      prompt: prompt, // SEU prompt exato, sem modificações
      n: 1,
      size: size as "256x256" | "512x512" | "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Nenhuma imagem editada foi gerada");
    }

    const editedImage = {
      id: generateImageId(),
      url: imageUrl,
      prompt: prompt, // SEU prompt original
      timestamp: Date.now(),
      isEdit: true,
    };

    return NextResponse.json(editedImage);
  } catch (error) {
    console.error("Erro na edição:", error);

    if (error instanceof Error) {
      if (error.message.includes("content_policy_violation")) {
        return NextResponse.json(
          {
            error:
              "O conteúdo solicitado não atende às políticas de uso. Tente uma descrição diferente.",
          },
          { status: 400 }
        );
      }
      if (error.message.includes("rate_limit_exceeded")) {
        return NextResponse.json(
          {
            error:
              "Limite de requisições excedido. Tente novamente em alguns momentos.",
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro interno do servidor ao editar imagem" },
      { status: 500 }
    );
  }
}
