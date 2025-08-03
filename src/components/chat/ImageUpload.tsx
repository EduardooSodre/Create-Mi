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
      <div className="relative group">
        <div className="relative w-full max-w-sm mx-auto">
          <Image
            src={uploadedImage.url}
            alt="Imagem para edição"
            width={300}
            height={300}
            className="rounded-lg border border-border object-cover w-full h-auto"
          />
          {onRemoveImage && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {uploadedImage.file.name}
        </p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {isDragActive ? (
          <>
            <Upload className="h-8 w-8 text-primary animate-bounce" />
            <p className="text-sm text-primary">Solte a imagem aqui...</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste uma imagem ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP até 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
