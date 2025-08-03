import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  enhancePrompt?: boolean;
}

function enhancePromptForProfessionalDesign(prompt: string): string {
  // Adiciona elementos de design profissional ao prompt
  const enhancementTerms = [
    "professional photography",
    "studio lighting",
    "high resolution",
    "detailed",
    "masterpiece",
    "award-winning",
    "cinematic",
    "ultra-realistic",
    "8K quality",
    "perfect composition",
    "balanced lighting",
    "sharp focus"
  ];

  // Adiciona termos aleatórios para melhorar a qualidade
  const randomEnhancements = enhancementTerms
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .join(", ");

  return `${prompt}, ${randomEnhancements}`;
}

function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      );
    }

    // Usar o prompt original ou aprimorado baseado na opção
    const finalPrompt = body.enhancePrompt 
      ? enhancePromptForProfessionalDesign(body.prompt)
      : body.prompt;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: body.size || "1024x1024",
      quality: body.quality || "hd",
      style: body.style || "vivid",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi gerada');
    }

    const generatedImage = {
      id: generateImageId(),
      url: imageUrl,
      prompt: body.prompt, // Sempre manter o prompt original do usuário
      revisedPrompt: response.data?.[0]?.revised_prompt, // Prompt final usado pela OpenAI
      timestamp: Date.now(),
    };
    
    return NextResponse.json(generatedImage);
  } catch (error) {
    console.error('Erro na API de geração de imagem:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar imagem' },
      { status: 500 }
    );
  }
}
