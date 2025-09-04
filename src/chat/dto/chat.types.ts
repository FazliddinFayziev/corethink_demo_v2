// src/chat/chat.types.ts
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  generatedPages?: any[];
}

export interface GenerateTemplateDto {
  message: string;
  conversationHistory: ChatMessage[];
}

export interface GenerateTemplateResponse {
  success: boolean;
  data?: {
    response: string;
    generatedPages: any[];
    conversationHistory: ChatMessage[];
    allGeneratedPages: any[];
  };
  error?: string;
}

export interface GetAllPagesDto {
  conversationHistory: ChatMessage[];
}

export interface GetAllPagesResponse {
  success: boolean;
  data?: {
    allGeneratedPages: any[];
  };
  error?: string;
}