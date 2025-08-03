"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Image as ImageIcon, Loader2, Upload, Edit3, RotateCcw } from "lucide-react";
import { ChatMessage, ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { ImageUpload } from "./ImageUpload";
import { MultipleImageUpload } from "./MultipleImageUpload";
import { ExamplePrompts } from "./ExamplePrompts";
import { generateImage, professionalEditImage, combineImages, downloadImage, GeneratedImage } from "@/lib/openai";
import { chatStorage } from "@/lib/storage";

interface UploadedImage {
  file: File;
  url: string;
  id: string;
}

export function AIImageChat() {
  // Mensagem de boas-vindas padrão
  const getWelcomeMessage = (): ChatMessage => ({
    id: "welcome",
    type: "assistant",
    content: "🎨 Olá! Sou seu AI Designer especializado em criação e edição de imagens.\n\n**Duas formas de usar:**\n📝 **Criar nova imagem**: Digite sua descrição e eu criarei uma obra-prima\n🖼️ **Editar imagem**: Faça upload de uma imagem e me diga como editá-la\n\nDicas para melhores resultados:\n• Seja específico sobre estilo, cores e composição\n• Para edições: descreva exatamente o que quer alterar\n• Use termos como 'fotorrealista', 'artístico', 'minimalista', etc.",
    timestamp: Date.now(),
  });

  // Estados
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [hasStoredMessages, setHasStoredMessages] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens salvas apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = chatStorage.loadMessages();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setHasStoredMessages(true);
      } else {
        setHasStoredMessages(false);
      }
    }
  }, []);

  // Salvar mensagens sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      chatStorage.saveMessages(messages);
      setHasStoredMessages(messages.length > 1 || messages[0].id !== 'welcome');
    }
  }, [messages]);

  // Função para rolar para o final automaticamente
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            ...message,
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        const userMessage = inputValue.trim();
        const isEditMode = mode === 'edit' && (uploadedImage || uploadedImages.length > 0);
        const hasMultipleImages = uploadedImages.length > 1;
        setInputValue("");

        // Adiciona mensagem do usuário
        addMessage({
            type: "user",
            content: isEditMode
                ? `✏️ ${hasMultipleImages ? 'Combinar/Editar imagens' : 'Editar imagem'}: ${userMessage}`
                : userMessage,
        });

        // Adiciona mensagem de carregamento
        const loadingMessage = addMessage({
            type: "assistant",
            content: isEditMode
                ? hasMultipleImages
                    ? "� ANÁLISE ULTRA-DETALHADA: Analisando características físicas, iluminação e composição... Criando combinação FOTORREALISTA preservando TODOS os detalhes originais!"
                    : "🎨 EDIÇÃO PROFISSIONAL: Analisando sua imagem com precisão... Aplicando modificações mantendo autenticidade fotográfica!"
                : "🎨 Criando sua imagem... Isso pode levar alguns segundos para garantir a melhor qualidade!",
        });

        setIsGenerating(true);

        try {
            let result: GeneratedImage;

            if (isEditMode && hasMultipleImages) {
                // Combina múltiplas imagens
                result = await combineImages({
                    prompt: userMessage,
                    images: uploadedImages
                });

                // Limpa as imagens após combinação
                uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
                setUploadedImages([]);
                setMode('create');
            } else if (isEditMode && uploadedImage) {
                // Edita a imagem existente com IA profissional
                result = await professionalEditImage({
                    prompt: userMessage,
                    image: uploadedImage.file,
                    size: "1024x1024"
                });

                // Limpa a imagem após edição
                URL.revokeObjectURL(uploadedImage.url);
                setUploadedImage(null);
                setMode('create');
            } else {
                // Gera nova imagem
                result = await generateImage({
                    prompt: userMessage,
                    quality: "hd",
                    style: "vivid",
                    size: "1024x1024"
                });
            }

            // Remove mensagem de carregamento
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

            // Adiciona mensagem de sucesso
            addMessage({
                type: "assistant",
                content: isEditMode
                    ? hasMultipleImages
                        ? "✨ Análise visual concluída! Suas imagens foram analisadas por IA e combinadas profissionalmente. Confira o resultado:"
                        : "✨ Imagem editada com sucesso! Confira o resultado:"
                    : "✨ Imagem criada com sucesso! Que tal essa criação?",
            });

            // Adiciona a imagem
            addMessage({
                type: "image",
                content: "",
                image: result,
            });

        } catch (error) {
            // Remove mensagem de carregamento
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

            // Adiciona mensagem de erro
            addMessage({
                type: "assistant",
                content: isEditMode
                    ? "😕 Desculpe, ocorreu um erro ao editar a imagem. Para edições, use imagens PNG com fundo transparente para melhores resultados."
                    : "😕 Desculpe, ocorreu um erro ao gerar a imagem. Verifique se a API key da OpenAI está configurada corretamente ou tente novamente com uma descrição diferente.",
            });

            console.error("Erro ao processar imagem:", error);
        } finally {
            setIsGenerating(false);
            inputRef.current?.focus();
        }
    };

  const handleDownloadImage = async (image: GeneratedImage) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `ai-image-${timestamp}-${image.id}.png`;
      
      // Mostrar mensagem de início
      addMessage({
        type: "assistant",
        content: `⏬ Iniciando download da imagem "${filename}"...`,
      });
      
      await downloadImage(image.url, filename);
      
      // Atualizar com sucesso
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.content.includes('Iniciando download')) {
          lastMessage.content = `✅ Download concluído! A imagem "${filename}" foi salva na sua pasta Downloads.`;
        }
        return newMessages;
      });
      
    } catch (error) {
      // Mensagem de erro mais específica
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.content.includes('Iniciando download')) {
          lastMessage.content = `❌ ${errorMessage}`;
        } else {
          // Se não há mensagem de início, adicionar nova mensagem de erro
          return [...newMessages, {
            id: `error-${Date.now()}`,
            type: "assistant" as const,
            content: `❌ ${errorMessage}`,
            timestamp: Date.now(),
          }];
        }
        return newMessages;
      });
      
      console.error("Erro ao baixar imagem:", error);
    }
  };

  const handleEditImage = async (image: GeneratedImage) => {
    try {
      addMessage({
        type: "assistant",
        content: `🔄 Preparando imagem para edição...`,
      });

      let file: File;
      let imageUrl: string;

      // Tentar converter URL da imagem para File
      try {
        const response = await fetch(image.url, {
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        file = new File([blob], `${image.id}.png`, { type: 'image/png' });
        imageUrl = URL.createObjectURL(file);
      } catch (fetchError) {
        // Se falhar o fetch da URL, tentar usar a imagem original se disponível
        if (image.originalImage) {
          const response = await fetch(image.originalImage);
          const blob = await response.blob();
          file = new File([blob], `${image.id}_original.png`, { type: 'image/png' });
          imageUrl = URL.createObjectURL(file);
        } else {
          throw new Error(`Não foi possível acessar a imagem: ${fetchError instanceof Error ? fetchError.message : 'URL inacessível'}`);
        }
      }
      
      // Configurar para modo de edição
      setUploadedImage({ file, url: imageUrl });
      setMode('edit');

      // Atualizar a última mensagem
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.content.includes('Preparando imagem')) {
          lastMessage.content = `🎨 Imagem selecionada para edição profissional! Digite suas modificações:\n\n**Exemplos de comandos:**\n• "Alterar o fundo para [descrição detalhada]"\n• "Mudar a cor para [cor específica]"\n• "Adicionar [elemento específico]"\n• "Remover [elemento específico]"\n• "Alterar o estilo para [estilo específico]"\n• "Melhorar a iluminação"\n• "Tornar mais realista"\n\n💡 **Dica:** Seja específico para obter resultados profissionais!`;
        }
        return newMessages;
      });

      // Scroll para o input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.content.includes('Preparando imagem')) {
          lastMessage.content = `❌ Erro ao preparar imagem para edição: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\n💡 Tente fazer upload da imagem novamente ou usar uma imagem diferente.`;
        }
        return newMessages;
      });
      console.error("Erro ao preparar imagem para edição:", error);
    }
  };
  
  const handleImageUpload = (file: File, imageUrl: string) => {
        setUploadedImage({ file, url: imageUrl });
        setMode('edit');

        addMessage({
            type: "assistant",
            content: `📷 Imagem "${file.name}" carregada! Agora me diga como você quer que eu a edite. Por exemplo:\n• "Remover o fundo"\n• "Mudar a cor para azul"\n• "Adicionar um chapéu"\n• "Tornar mais brilhante"`,
        });
    };

    const handleRemoveImage = () => {
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }
        setUploadedImage(null);
        setMode('create');

        addMessage({
            type: "assistant",
            content: "🗑️ Imagem removida. Agora você pode criar uma nova imagem ou fazer upload de outra para editar.",
        });
    };

    // Funções para múltiplas imagens
    const handleMultipleImagesUpload = (images: UploadedImage[]) => {
        setUploadedImages(images);
        setUploadedImage(null); // Limpar imagem única se houver
        setMode('edit');

        if (images.length === 1) {
            addMessage({
                type: "assistant",
                content: `📷 Imagem "${images[0].file.name}" carregada! Agora me diga como você quer que eu a edite.`,
            });
        } else {
            addMessage({
                type: "assistant",
                content: `� ${images.length} imagens carregadas! O sistema analisará visualmente cada imagem usando IA para entender seu conteúdo, e então criará uma combinação profissional baseada na sua descrição.\n\nExemplos de comandos:\n• "Combinar essas imagens em uma composição artística"\n• "Colocar a pessoa da primeira foto no cenário da segunda"\n• "Criar um collage profissional com essas imagens"\n• "Mesclar os elementos principais em uma cena única"`,
            });
        }
    };

    const handleRemoveMultipleImage = (id: string) => {
        const updatedImages = uploadedImages.filter(img => {
            if (img.id === id) {
                URL.revokeObjectURL(img.url);
                return false;
            }
            return true;
        });
        
        setUploadedImages(updatedImages);
        
        if (updatedImages.length === 0) {
            setMode('create');
            addMessage({
                type: "assistant",
                content: "🗑️ Todas as imagens foram removidas. Agora você pode criar uma nova imagem ou fazer upload de outras para editar.",
            });
        } else {
            addMessage({
                type: "assistant",
                content: `🗑️ Imagem removida. Ainda há ${updatedImages.length} imagem(ns) para editar.`,
            });
        }
    };

    const toggleMode = () => {
        if (mode === 'edit' && (uploadedImage || uploadedImages.length > 0)) {
            // Limpar todas as imagens
            if (uploadedImage) {
                URL.revokeObjectURL(uploadedImage.url);
            }
            uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
            
            setUploadedImage(null);
            setUploadedImages([]);
            setMode('create');
            
            addMessage({
                type: "assistant",
                content: "🔄 Mudando para modo criação. Todas as imagens foram removidas.",
            });
        } else {
            setMode(mode === 'create' ? 'edit' : 'create');
        }
    };

  const handleSelectPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    const confirmClear = window.confirm('Tem certeza que deseja limpar todas as conversas? Esta ação não pode ser desfeita.');
    
    if (confirmClear) {
      // Limpar localStorage
      chatStorage.clearMessages();
      
      // Limpar URLs das imagens para evitar memory leaks
      uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.url);
      }
      
      // Resetar estado para mensagem de boas-vindas
      setMessages([getWelcomeMessage()]);
      setUploadedImage(null);
      setUploadedImages([]);
      setMode('create');
      setInputValue('');
      setHasStoredMessages(false);
      
      // Opcional: mostrar feedback
      setTimeout(() => {
        addMessage({
          type: "assistant",
          content: "🗑️ Conversas limpas! Começando uma nova sessão.",
        });
      }, 500);
    }
  };  return (
    <div className="flex flex-col h-[600px] bg-background border neon-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <ImageIcon className="h-6 w-6 text-primary" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold gradient-text">AI Image Creator</h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'create' ? 'Modo: Criar Imagem' : 'Modo: Editar Imagem'}
              {hasStoredMessages && (
                <span className="ml-2 text-green-500">• Conversas salvas</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão Limpar Conversas */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={isGenerating}
            className="gap-2 text-destructive hover:text-destructive"
            title="Limpar todas as conversas"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
          
          {/* Toggle Mode Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            disabled={isGenerating}
            className="gap-2"
          >
            {mode === 'create' ? (
              <>
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Criar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-0">
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onDownloadImage={handleDownloadImage}
              onEditImage={handleEditImage}
            />
          ))}
          
          {/* Exemplos - só mostra quando não há muitas mensagens */}
          {messages.length <= 2 && !isGenerating && (
            <div className="p-4 border-t border-dashed">
              <ExamplePrompts 
                onSelectPrompt={handleSelectPrompt}
                mode={mode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-2 border-t bg-background/50 backdrop-blur space-y-1 flex-shrink-0">
        {/* Upload Area - Só mostra no modo edit */}
        {mode === 'edit' && (
          <div className="border rounded p-1 bg-muted/20">
            <div className="flex items-center gap-1 mb-1">
              <Upload className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">Upload para Edição/Combinação</span>
            </div>
            
            {/* Toggles para escolher entre upload único ou múltiplo */}
            <div className="flex gap-1 mb-1">
              <Button
                type="button"
                variant={!uploadedImages.length && uploadedImage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  // Limpar múltiplas imagens
                  uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
                  setUploadedImages([]);
                }}
                className="text-xs h-6 px-2"
              >
                📷 Uma
              </Button>
              <Button
                type="button"
                variant={uploadedImages.length > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  // Limpar imagem única
                  if (uploadedImage) {
                    URL.revokeObjectURL(uploadedImage.url);
                    setUploadedImage(null);
                  }
                }}
                className="text-xs h-6 px-2"
              >
                🖼️ Múltiplas
              </Button>
            </div>

            {/* Componente de upload baseado na escolha */}
            {uploadedImages.length > 0 || (!uploadedImage && !uploadedImages.length) ? (
              <MultipleImageUpload
                onImagesUpload={handleMultipleImagesUpload}
                uploadedImages={uploadedImages}
                onRemoveImage={handleRemoveMultipleImage}
                disabled={isGenerating}
                maxImages={4}
              />
            ) : (
              <ImageUpload
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
                onRemoveImage={handleRemoveImage}
                disabled={isGenerating}
              />
            )}
          </div>
        )}
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                mode === 'edit' && (uploadedImage || uploadedImages.length > 0)
                  ? uploadedImages.length > 1 
                    ? "Como você quer combinar essas imagens?"
                    : "Como você quer editar esta imagem?"
                  : "Descreva a imagem que você quer criar..."
              }
              disabled={isGenerating || (mode === 'edit' && !uploadedImage && uploadedImages.length === 0)}
              className="neon-border focus:neon-glow"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isGenerating || (mode === 'edit' && !uploadedImage && uploadedImages.length === 0)}
            variant="gradient"
            size="icon"
            className="shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          {mode === 'create' ? (
            <>🎯 Usa exatamente seu prompt sem modificações</>
          ) : (
            <>✏️ {uploadedImages.length > 1 
              ? 'Múltiplas imagens carregadas! Descreva a modificação que quer aplicar. O ambiente e elementos originais serão preservados.'
              : 'Imagem carregada! Descreva exatamente a modificação que quer fazer. O ambiente original será preservado.'
            }</>
          )}
        </p>
      </div>
    </div>
  );
}
