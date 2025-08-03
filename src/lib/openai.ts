export interface ImageGenerationRequest {
  prompt: string;
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  enhancePrompt?: boolean;
}

export interface ImageEditRequest {
  prompt: string;
  image: File;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface ImageCombineRequest {
  prompt: string;
  images: { file: File; url: string; id: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  enhancedPrompt?: string;
  timestamp: number;
  isEdit?: boolean;
  isCombination?: boolean;
  sourceImageCount?: number;
  originalImage?: string;
}

export async function generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar imagem');
    }

    const generatedImage = await response.json();
    return generatedImage;
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    throw error;
  }
}

export async function editImage(request: ImageEditRequest): Promise<GeneratedImage> {
  try {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('image', request.image);
    if (request.size) {
      formData.append('size', request.size);
    }

    const response = await fetch('/api/edit-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao editar imagem');
    }

    const editedImage = await response.json();
    return editedImage;
  } catch (error) {
    console.error('Erro ao editar imagem:', error);
    throw error;
  }
}

export async function combineImages(request: ImageCombineRequest): Promise<GeneratedImage> {
  try {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    
    // Adicionar cada imagem ao FormData
    request.images.forEach((image, index) => {
      formData.append(`image_${index}`, image.file);
    });

    const response = await fetch('/api/combine-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao combinar imagens');
    }

    const combinedImage = await response.json();
    return combinedImage;
  } catch (error) {
    console.error('Erro ao combinar imagens:', error);
    throw error;
  }
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    console.log('Iniciando download da imagem:', url);
    
    // Usar nossa API route para fazer o download
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: url,
        filename: filename.endsWith('.png') ? filename : filename.replace(/\.[^/.]+$/, '.png')
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro de rede' }));
      console.error('Erro na API de download:', response.status, errorData);
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    // Obter o blob da resposta
    const blob = await response.blob();
    console.log('Blob recebido, tamanho:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('Imagem vazia recebida');
    }
    
    // Criar link de download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Garantir extensão PNG
    const pngFilename = filename.endsWith('.png') ? filename : filename.replace(/\.[^/.]+$/, '.png');
    link.download = pngFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Download iniciado com sucesso:', pngFilename);
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);
    
  } catch (error) {
    console.error('Erro ao baixar imagem:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.message.includes('HTTP')) {
        throw new Error('Erro no servidor. A imagem pode não estar mais disponível.');
      } else {
        throw new Error(`Erro ao baixar: ${error.message}`);
      }
    } else {
      throw new Error('Erro desconhecido ao baixar a imagem.');
    }
  }
}
