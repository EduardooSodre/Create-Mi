import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function enhanceEditPrompt(prompt: string): string {
  // Adiciona elementos específicos para edição de imagens
  const enhancementTerms = [
    "high quality",
    "detailed",
    "professional",
    "precise editing",
    "seamless integration",
    "realistic",
    "well-blended"
  ];

  const randomEnhancements = enhancementTerms
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .join(", ");

  return `${prompt}, ${randomEnhancements}`;
}

function generateImageId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;
    const size = formData.get('size') as string || '1024x1024';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória' },
        { status: 400 }
      );
    }

    // Verifica o tipo de arquivo
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Verifica o tamanho do arquivo (máximo 4MB)
    if (imageFile.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagem deve ter no máximo 4MB' },
        { status: 400 }
      );
    }

    const enhancedPrompt = enhanceEditPrompt(prompt);

    const response = await openai.images.edit({
      model: "dall-e-2", // DALL-E 3 não suporta edição, apenas DALL-E 2
      image: imageFile,
      prompt: enhancedPrompt,
      n: 1,
      size: size as "1024x1024" | "512x512" | "256x256",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi gerada');
    }

    const editedImage = {
      id: generateImageId(),
      url: imageUrl,
      prompt: prompt,
      revisedPrompt: enhancedPrompt,
      timestamp: Date.now(),
      isEdit: true,
    };
    
    return NextResponse.json(editedImage);
  } catch (error) {
    console.error('Erro na API de edição de imagem:', error);
    
    // Verifica se é um erro específico da OpenAI
    if (error instanceof Error) {
      if (error.message.includes('The image must be a valid PNG file')) {
        return NextResponse.json(
          { error: 'A imagem deve estar em formato PNG com transparência para edição' },
          { status: 400 }
        );
      }
      if (error.message.includes('invalid_image')) {
        return NextResponse.json(
          { error: 'Formato de imagem inválido. Use PNG com fundo transparente para melhores resultados.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao editar imagem' },
      { status: 500 }
    );
  }
}
