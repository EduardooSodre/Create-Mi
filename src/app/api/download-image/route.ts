import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, filename } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      );
    }

    console.log('Tentando baixar imagem:', imageUrl);

    // Fetch da imagem com headers apropriados
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Erro na resposta:', response.status, response.statusText);
      throw new Error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    console.log('Imagem baixada com sucesso, tamanho:', imageBuffer.byteLength);
    
    // Determinar o tipo de conteúdo
    const contentType = response.headers.get('content-type') || 'image/png';
    const finalFilename = filename || 'ai-image.png';
    
    // Retornar a imagem como resposta
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Erro no download da imagem:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor ao baixar imagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
