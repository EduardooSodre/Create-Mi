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

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    if (!image) {
        return NextResponse.json(
            { error: "Imagem é obrigatória" },
            { status: 400 }
        );
    }

    // Verifica o tipo de arquivo
    if (!image.type.startsWith("image/")) {
        return NextResponse.json(
            { error: "Arquivo deve ser uma imagem" },
            { status: 400 }
        );
    }

    // Verifica o tamanho do arquivo (máximo 4MB)
    if (image.size > 4 * 1024 * 1024) {
        return NextResponse.json(
            { error: "Imagem deve ter no máximo 4MB" },
            { status: 400 }
        );
    }

    // Usar EXATAMENTE o prompt do usuário sem modificações
    console.log("Prompt de edição:", prompt);

    const response = await openai.images.edit({
      image: image,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Nenhuma imagem foi gerada");
    }

    const editedImage = {
      id: generateImageId(),
      url: imageUrl,
      prompt: prompt, // Prompt original do usuário
      timestamp: Date.now(),
      isEdit: true,
    };

    return NextResponse.json(editedImage);
  } catch (error) {
    console.error("Erro na API de edição de imagem:", error);

    // Verifica se é um erro específico da OpenAI
    if (error instanceof Error) {
      if (
        error.message.includes("The image must be a valid PNG file") ||
        error.message.includes("invalid_image") ||
        error.message.includes("PNG")
      ) {
        return NextResponse.json(
          {
            error:
              "Para editar imagens, é necessário usar formato PNG com fundo transparente. Converta sua imagem para PNG primeiro.",
          },
          { status: 400 }
        );
      }
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
      {
        error:
          "Erro interno do servidor ao editar imagem. Verifique se a imagem está em formato PNG com transparência.",
      },
      { status: 500 }
    );
  }
}
