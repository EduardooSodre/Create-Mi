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

async function enhancePromptWithGPT4Vision(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional image generation specialist with 20+ years of experience in photography, digital art, and visual design. Create enhanced, detailed prompts for DALL-E 3 that result in professional, high-quality images."
        },
        {
          role: "user",
          content: `Transform this user prompt into a professional, detailed DALL-E 3 prompt that will create exceptional visual results:

USER PROMPT: "${prompt}"

Requirements:
1. Maintain the core concept and intent
2. Add professional photography/art terminology
3. Include lighting, composition, and technical details
4. Specify camera angles, depth of field if relevant
5. Add quality descriptors (professional, high-resolution, etc.)
6. Include artistic style references when appropriate
7. Make it detailed but concise
8. Ensure it will produce visually stunning results

Return only the enhanced prompt, no explanation.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const enhancedPrompt = response.choices[0]?.message?.content;
    return enhancedPrompt || enhancePromptForProfessionalDesign(prompt);
  } catch (error) {
    console.error('Erro ao aprimorar prompt com GPT-4 Vision:', error);
    // Fallback para o método anterior
    return enhancePromptForProfessionalDesign(prompt);
  }
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

    console.log('Prompt original:', body.prompt);

    // Usar o prompt original ou aprimorado baseado na opção
    let finalPrompt = body.prompt;
    
    if (body.enhancePrompt) {
      console.log('Aprimorando prompt com GPT-4 Vision...');
      finalPrompt = await enhancePromptWithGPT4Vision(body.prompt);
      console.log('Prompt aprimorado:', finalPrompt);
    }
    
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
      enhancedPrompt: body.enhancePrompt ? finalPrompt : undefined, // Prompt aprimorado pelo GPT-4 Vision
      timestamp: Date.now(),
    };
    
    return NextResponse.json(generatedImage);
  } catch (error) {
    console.error('Erro na API de geração de imagem:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { error: 'O conteúdo solicitado não atende às políticas de uso. Tente uma descrição diferente.' },
          { status: 400 }
        );
      }
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { error: 'Limite de requisições excedido. Tente novamente em alguns momentos.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar imagem' },
      { status: 500 }
    );
  }
}
