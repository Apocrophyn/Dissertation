export type ChatType = 'symptom-checker' | 'report-analyzer' | 'mental-health';

export interface ChatRequest {
  type: ChatType;
  message: string;
  fileUrl?: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  error?: string;
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
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
} 