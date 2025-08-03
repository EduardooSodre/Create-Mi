"use client";

import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUpload: (file: File, imageUrl: string) => void;
  uploadedImage?: {
    file: File;
    url: string;
  } | null;
  onRemoveImage?: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  onImageUpload,
  uploadedImage,
  onRemoveImage,
  disabled = false
}: ImageUploadProps) {
  // Função para converter imagem para PNG
  const convertToPNG = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const htmlImg = document.createElement('img');
      
      htmlImg.onload = () => {
        canvas.width = htmlImg.width;
        canvas.height = htmlImg.height;
        
        // Preenche com fundo transparente
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(htmlImg, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), {
              type: 'image/png',
              lastModified: Date.now(),
            });
            resolve(pngFile);
          }
        }, 'image/png');
      };
      
      htmlImg.src = URL.createObjectURL(file);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Converte automaticamente para PNG se não for PNG
      let processedFile = file;
      if (file.type !== 'image/png') {
        processedFile = await convertToPNG(file);
      }
      
      const imageUrl = URL.createObjectURL(processedFile);
      onImageUpload(processedFile, imageUrl);
    }
  }, [onImageUpload, convertToPNG]);

  // Função para lidar com Ctrl+V
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (disabled) return;
    
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Converte automaticamente para PNG se não for PNG
          let processedFile = file;
          if (file.type !== 'image/png') {
            processedFile = await convertToPNG(file);
          }
          
          const imageUrl = URL.createObjectURL(processedFile);
          onImageUpload(processedFile, imageUrl);
          event.preventDefault();
          break;
        }
      }
    }
  }, [onImageUpload, disabled, convertToPNG]);

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
    maxFiles: 1,
    disabled
  });

  if (uploadedImage) {
    return (
      <div className="flex items-center gap-2 p-1 bg-muted/10 rounded border">
        <div className="relative flex-shrink-0">
          <Image
            src={uploadedImage.url}
            alt="Imagem para edição"
            width={40}
            height={32}
            className="rounded border border-border object-cover w-10 h-8"
          />
          {onRemoveImage && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemoveImage}
            >
              <X className="h-2 w-2" />
            </Button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {uploadedImage.file.name}
          </p>
          <p className="text-xs text-green-400">✓ Pronta para editar</p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-1">
        {isDragActive ? (
          <>
            <Upload className="h-4 w-4 text-primary animate-bounce" />
            <p className="text-xs text-primary">Solte a imagem aqui...</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Clique, arraste ou Ctrl+V
            </p>
          </>
        )}
      </div>
    </div>
  );
}
