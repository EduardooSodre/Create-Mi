import { ChatMessage } from "@/components/chat/ChatMessage";

const CHAT_STORAGE_KEY = 'ai-image-chat-messages';

export const chatStorage = {
  // Salvar mensagens no localStorage
  saveMessages: (messages: ChatMessage[]): void => {
    try {
      const dataToSave = {
        messages,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
    }
  },

  // Carregar mensagens do localStorage
  loadMessages: (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);
      
      // Verificar se é um formato válido
      if (data.messages && Array.isArray(data.messages)) {
        return data.messages;
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      return [];
    }
  },

  // Limpar todas as mensagens
  clearMessages: (): void => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
    }
  },

  // Verificar se há mensagens salvas
  hasStoredMessages: (): boolean => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      return stored !== null;
    } catch {
      return false;
    }
  }
};
