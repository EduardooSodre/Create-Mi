"use client";

import { useCallback } from 'react';
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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
  }, [onImageUpload]);

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
              Clique ou arraste uma imagem
            </p>
          </>
        )}
      </div>
    </div>
  );
}
