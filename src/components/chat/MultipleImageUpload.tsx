"use client";

import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface UploadedImage {
  file: File;
  url: string;
  id: string;
}

interface MultipleImageUploadProps {
  onImagesUpload: (images: UploadedImage[]) => void;
  uploadedImages: UploadedImage[];
  onRemoveImage: (id: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function MultipleImageUpload({
  onImagesUpload,
  uploadedImages,
  onRemoveImage,
  disabled = false,
  maxImages = 4
}: MultipleImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles.slice(0, maxImages - uploadedImages.length).map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    if (newImages.length > 0) {
      onImagesUpload([...uploadedImages, ...newImages]);
    }
  }, [onImagesUpload, uploadedImages, maxImages]);

  // Função para lidar com Ctrl+V
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (disabled || uploadedImages.length >= maxImages) return;
    
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/') && imageFiles.length < (maxImages - uploadedImages.length)) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      const newImages: UploadedImage[] = imageFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      onImagesUpload([...uploadedImages, ...newImages]);
      event.preventDefault();
    }
  }, [onImagesUpload, uploadedImages, disabled, maxImages]);

  // Adicionar event listener para Ctrl+V
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxFiles: maxImages,
    disabled: disabled || uploadedImages.length >= maxImages
  });

  const canAddMore = uploadedImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Lista horizontal de imagens uploadadas */}
      {uploadedImages.length > 0 && (
        <div className="flex gap-1 p-1 bg-muted/10 rounded border overflow-x-auto">
          {uploadedImages.map((image, index) => (
            <div key={image.id} className="relative group flex-shrink-0">
              <div className="relative">
                <Image
                  src={image.url}
                  alt={`Img ${index + 1}`}
                  width={40}
                  height={32}
                  className="rounded border border-border object-cover w-10 h-8"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(image.id)}
                >
                  <X className="h-2 w-2" />
                </Button>
                <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 rounded-tr leading-none">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center px-2">
            <p className="text-xs text-green-400 whitespace-nowrap">
              ✓ {uploadedImages.length} pronta{uploadedImages.length > 1 ? 's' : ''} para combinar
            </p>
          </div>
        </div>
      )}

      {/* Área de upload */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`
            border border-dashed rounded p-1 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-1">
            {isDragActive ? (
              <>
                <Upload className="h-3 w-3 text-primary animate-bounce" />
                <p className="text-xs text-primary">Solte aqui...</p>
              </>
            ) : (
              <>
                {uploadedImages.length > 0 ? (
                  <>
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Adicionar mais ({uploadedImages.length}/{maxImages})
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Clique, arraste ou Ctrl+V múltiplas imagens
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
