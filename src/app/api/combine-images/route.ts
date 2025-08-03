import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function enhanceCombinePrompt(prompt: string, imageAnalysis: string): string {
  return `Create a professional, high-quality image that combines the visual elements described in this analysis: ${imageAnalysis}

User request: ${prompt}

Requirements:
- Professional composition and lighting
- Seamless integration of elements
- High detail and artistic quality
- Realistic proportions and perspective
- Cohesive color palette
- Sharp focus and clarity
- Professional photography or digital art style`;
}

function generateImageId(): string {
  return `combine_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const imageFiles: File[] = [];

    // Coletar todas as imagens do FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    if (imageFiles.length < 2) {
      return NextResponse.json(
        { error: "Pelo menos 2 imagens são necessárias para combinação" },
        { status: 400 }
      );
    }

    console.log("Analisando", imageFiles.length, "imagens para combinação...");

    // Converter imagens para base64 para análise
    const imageAnalyses: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type;

      // Analisar cada imagem individualmente
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image in detail. Describe:
1. Main subjects/objects and their positions
2. Color scheme and lighting
3. Style and composition
4. Background and environment
5. Any text or distinctive features
Be specific and detailed for image combination purposes.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const analysis =
        analysisResponse.choices[0]?.message?.content ||
        `Image ${i + 1} analysis unavailable`;
      imageAnalyses.push(`Image ${i + 1}: ${analysis}`);

      console.log(`Análise da imagem ${i + 1} concluída`);
    }

    // Combinar análises e criar prompt detalhado
    const combinedAnalysis = imageAnalyses.join("\n\n");

    // Usar GPT-4 para criar um prompt de combinação inteligente
    const promptEnhancementResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional image generation specialist with 20+ years of experience in photography, digital art, and visual design. Create a detailed prompt for combining multiple images based on their visual analyses.",
        },
        {
          role: "user",
          content: `Analyze the following images and create a professional prompt for combining them:

IMAGE ANALYSES:
${combinedAnalysis}

USER REQUEST: ${prompt}

Create a professional, detailed prompt that:
1. Combines the best elements from all images
2. Maintains realistic proportions and lighting
3. Creates a cohesive, professional composition
4. Incorporates the user's specific request
5. Results in high-quality, professional output

Return only the prompt, no explanation.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const enhancedPrompt =
      promptEnhancementResponse.choices[0]?.message?.content ||
      enhanceCombinePrompt(prompt, combinedAnalysis);

    console.log("Prompt aprimorado:", enhancedPrompt);

    // Gerar a imagem combinada
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error("Nenhuma imagem foi gerada");
    }

    const combinedImage = {
      id: generateImageId(),
      url: imageUrl,
      prompt: prompt,
      revisedPrompt: revisedPrompt || enhancedPrompt,
      timestamp: Date.now(),
      isCombination: true,
      sourceImageCount: imageFiles.length,
      analysisUsed: true,
    };

    return NextResponse.json(combinedImage);
  } catch (error) {
    console.error("Erro na API de combinação de imagens:", error);

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
      { error: "Erro interno do servidor ao combinar imagens" },
      { status: 500 }
    );
  }
}
