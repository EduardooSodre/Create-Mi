import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, User, Bot, Clock, Sparkles, Edit3 } from "lucide-react";
import { GeneratedImage } from "@/lib/openai";
import Image from "next/image";

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'image';
  content: string;
  timestamp: number;
  image?: GeneratedImage;
}

interface ChatMessageProps {
  message: ChatMessage;
  onDownloadImage?: (image: GeneratedImage) => void;
  onEditImage?: (image: GeneratedImage) => void;
}

export function ChatMessage({ message, onDownloadImage, onEditImage }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const isImage = message.type === 'image';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (message.image && onDownloadImage) {
      onDownloadImage(message.image);
    }
  };

  const handleEdit = () => {
    if (message.image && onEditImage) {
      onEditImage(message.image);
    }
  };

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={isUser ? undefined : "/bot-avatar.png"} />
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {isUser ? 'Você' : 'AI Designer'}
          </span>
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted text-muted-foreground'
        } ${isImage ? 'bg-transparent p-0' : ''}`}>
          
          {isImage && message.image ? (
            <div className="space-y-3">
              <div className="relative group">
                <Image
                  src={message.image.url}
                  alt={message.image.prompt}
                  width={512}
                  height={512}
                  className="rounded-lg max-w-md w-full h-auto neon-border"
                  loading="lazy"
                />
                {/* Overlay com botões centralizados */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <div className="flex gap-3">
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={handleEdit}
                      className="neon-glow shadow-2xl transform hover:scale-105 transition-transform"
                    >
                      <Edit3 className="h-5 w-5 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={handleDownload}
                      className="neon-glow shadow-2xl transform hover:scale-105 transition-transform"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Baixar PNG
                    </Button>
                  </div>
                </div>
                
                {/* Indicador de download no canto */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 rounded-full p-1">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {message.image.isEdit ? 'Edição solicitada:' : 'Prompt original:'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {message.image.prompt}
                </p>
                
                {message.image.revisedPrompt && (
                  <>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">
                        {message.image.isEdit ? 'Prompt de edição aprimorado:' : 'Prompt aprimorado:'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {message.image.revisedPrompt}
                    </p>
                  </>
                )}
                
                {message.image.isEdit && (
                  <div className="text-xs text-accent bg-accent/10 p-2 rounded border border-accent/20">
                    ✨ Imagem editada com IA
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
