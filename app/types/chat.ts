export type ChatType = 'symptom-checker' | 'report-analyzer' | 'mental-health';

export interface ChatRequest {
  type: ChatType;
  message: string;
  fileUrl?: string;
}

export interface ChatResponse {
  message: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  hasFile?: boolean;
  fileName?: string;
}

export interface ChatSession {
  id: string;
  type: ChatType;
  timestamp: Date;
  lastMessage?: string;
  messages: Message[];
}

// OpenAI chat types
export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessageContent {
  type: 'text';
  text: string;
}

export interface ChatImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail: 'low' | 'high' | 'auto';
  };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | (ChatMessageContent | ChatImageContent)[];
}

export type { ChatMessage as OpenAIChatMessage };
export type { ChatRole as OpenAIChatRole }; 