"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Image as ImageIcon, Loader2, Upload, Edit3, RotateCcw } from "lucide-react";
import { ChatMessage, ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { ImageUpload } from "./ImageUpload";
import { ExamplePrompts } from "./ExamplePrompts";
import { generateImage, editImage, downloadImage, GeneratedImage } from "@/lib/openai";
import { chatStorage } from "@/lib/storage";

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
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
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
        const isEditMode = mode === 'edit' && uploadedImage;
        setInputValue("");

        // Adiciona mensagem do usuário
        addMessage({
            type: "user",
            content: isEditMode
                ? `✏️ Editar imagem: ${userMessage}`
                : userMessage,
        });

        // Adiciona mensagem de carregamento
        const loadingMessage = addMessage({
            type: "assistant",
            content: isEditMode
                ? "🎨 Editando sua imagem... Aplicando as alterações solicitadas!"
                : "🎨 Criando sua imagem... Isso pode levar alguns segundos para garantir a melhor qualidade!",
        });

        setIsGenerating(true);

        try {
            let result: GeneratedImage;

            if (isEditMode && uploadedImage) {
                // Edita a imagem existente
                result = await editImage({
                    prompt: userMessage,
                    image: uploadedImage.file,
                    size: "1024x1024"
                });

                // Limpa a imagem após edição
                setUploadedImage(null);
                setMode('create');
            } else {
                // Gera nova imagem
                result = await generateImage({
                    prompt: userMessage,
                    quality: "hd",
                    style: "vivid",
                    size: "1024x1024",
                    enhancePrompt: enhancePrompt
                });
            }

            // Remove mensagem de carregamento
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

            // Adiciona mensagem de sucesso
            addMessage({
                type: "assistant",
                content: isEditMode
                    ? "✨ Imagem editada com sucesso! Confira o resultado:"
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
  };    const handleImageUpload = (file: File, imageUrl: string) => {
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

    const toggleMode = () => {
        if (mode === 'edit' && uploadedImage) {
            handleRemoveImage();
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
      
      // Resetar estado para mensagem de boas-vindas
      setMessages([getWelcomeMessage()]);
      setUploadedImage(null);
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
      <div className="p-4 border-t bg-background/50 backdrop-blur space-y-3 flex-shrink-0">
        {/* Upload Area - Só mostra no modo edit */}
        {mode === 'edit' && (
          <div className="border rounded-lg p-3 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Upload de Imagem para Edição</span>
            </div>
            <ImageUpload
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
              onRemoveImage={handleRemoveImage}
              disabled={isGenerating}
            />
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
                mode === 'edit' && uploadedImage
                  ? "Como você quer editar esta imagem?"
                  : "Descreva a imagem que você quer criar..."
              }
              disabled={isGenerating || (mode === 'edit' && !uploadedImage)}
              className="neon-border focus:neon-glow"
            />
            
            {/* Toggle para aprimoramento de prompt - só no modo criar */}
            {mode === 'create' && (
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enhancePrompt}
                    onChange={(e) => setEnhancePrompt(e.target.checked)}
                    className="w-3 h-3 rounded border border-border"
                  />
                  <span className="text-muted-foreground">
                    🚀 Aprimorar prompt automaticamente
                  </span>
                </label>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isGenerating || (mode === 'edit' && !uploadedImage)}
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
            <>💡 {enhancePrompt ? 'Com aprimoramento: adiciona termos profissionais automaticamente' : 'Sem aprimoramento: usa exatamente seu prompt'}</>
          ) : (
            <>✏️ Faça upload de uma imagem e descreva como editá-la. Ex: &ldquo;Remover fundo&rdquo;, &ldquo;Mudar cor para azul&rdquo;</>
          )}
        </p>
      </div>
    </div>
  );
}
